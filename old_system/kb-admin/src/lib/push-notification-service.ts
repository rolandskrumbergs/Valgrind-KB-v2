"use server";

import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from "expo-server-sdk";
import { db } from "@/db";
import { pushTokens } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  withTelemetry,
  trackServerEvent,
  trackServerException,
  trackTrace,
  withServerSpan,
} from "@/lib/telemetry-server";

// Create a new Expo SDK client
const expo = new Expo();

export interface SendNewsNotificationParams {
  newsId: string;
  newsTitle: string;
  newsExcerpt?: string;
  targetUserIds?: string[]; // Optional: target specific users
}

/**
 * Send push notifications to users when news is published
 */
export const sendNewsNotification = withTelemetry(
  "sendNewsNotification",
  async ({
    newsId,
    newsTitle,
    newsExcerpt,
    targetUserIds,
  }: SendNewsNotificationParams): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    tickets: ExpoPushTicket[];
  }> => {
    const startTime = Date.now();

    // Track notification send attempt
    trackServerEvent("push_notification:news_send_started", {
      news_id: newsId,
      news_title: newsTitle,
      target_mode: targetUserIds ? "targeted" : "broadcast",
      target_user_count: targetUserIds?.length || 0,
    });

    try {
      // Fetch push tokens from database with tracking
      return await withServerSpan("fetch_push_tokens", async (span) => {
        let tokens;

        if (targetUserIds && targetUserIds.length > 0) {
          span.setAttribute("token_fetch.mode", "targeted");
          span.setAttribute("token_fetch.user_count", targetUserIds.length);

          tokens = await db.query.pushTokens.findMany({
            where: inArray(pushTokens.userId, targetUserIds),
          });
        } else {
          span.setAttribute("token_fetch.mode", "broadcast");
          tokens = await db.query.pushTokens.findMany();
        }

        const tokenCount = tokens.length;
        span.setAttribute("token_fetch.result_count", tokenCount);

        trackTrace(
          `Fetched ${tokenCount} push tokens for news notification`,
          "info",
          {
            news_id: newsId,
            token_count: tokenCount,
          },
        );

        if (tokenCount === 0) {
          trackServerEvent("push_notification:no_tokens_found", {
            news_id: newsId,
            target_mode: targetUserIds ? "targeted" : "broadcast",
          });

          trackTrace("No push tokens found for news notification", "warn", {
            news_id: newsId,
          });

          return {
            success: true,
            sentCount: 0,
            failedCount: 0,
            tickets: [],
          };
        }

        // Filter valid Expo push tokens
        return await withServerSpan(
          "validate_expo_tokens",
          async (validateSpan) => {
            const validTokens = tokens
              .map((t) => t.expoPushToken)
              .filter((token) => Expo.isExpoPushToken(token));

            const invalidCount = tokenCount - validTokens.length;
            validateSpan.setAttribute(
              "token_validation.valid_count",
              validTokens.length,
            );
            validateSpan.setAttribute(
              "token_validation.invalid_count",
              invalidCount,
            );

            if (invalidCount > 0) {
              trackServerEvent("push_notification:invalid_tokens_detected", {
                news_id: newsId,
                invalid_count: invalidCount,
                total_count: tokenCount,
              });
            }

            if (validTokens.length === 0) {
              trackServerEvent("push_notification:no_valid_tokens", {
                news_id: newsId,
                total_tokens: tokenCount,
              });

              trackTrace(
                "No valid Expo push tokens found for news notification",
                "warn",
                {
                  news_id: newsId,
                  invalid_count: invalidCount,
                },
              );

              return {
                success: true,
                sentCount: 0,
                failedCount: 0,
                tickets: [],
              };
            }

            // Create push messages
            return await withServerSpan(
              "send_notifications",
              async (sendSpan) => {
                const messages: ExpoPushMessage[] = validTokens.map(
                  (token) => ({
                    to: token,
                    sound: "default",
                    title: newsTitle,
                    body: newsExcerpt,
                    data: {
                      newsId,
                      screen: `/(app)/news/${newsId}`,
                      type: "news",
                    },
                    badge: 1,
                    priority: "high",
                  }),
                );

                // Split messages into chunks (Expo recommends chunks of 100)
                const chunks = expo.chunkPushNotifications(messages);
                const tickets: ExpoPushTicket[] = [];

                sendSpan.setAttribute(
                  "notification.message_count",
                  messages.length,
                );
                sendSpan.setAttribute(
                  "notification.chunk_count",
                  chunks.length,
                );

                trackTrace(
                  `Sending ${messages.length} notifications in ${chunks.length} chunks`,
                  "info",
                  {
                    news_id: newsId,
                    message_count: messages.length,
                    chunk_count: chunks.length,
                  },
                );

                // Send notifications in chunks
                for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i];
                  try {
                    const chunkStartTime = Date.now();
                    const ticketChunk =
                      await expo.sendPushNotificationsAsync(chunk);
                    const chunkDuration = Date.now() - chunkStartTime;

                    tickets.push(...ticketChunk);

                    trackServerEvent("push_notification:chunk_sent", {
                      news_id: newsId,
                      chunk_index: i + 1,
                      chunk_size: chunk.length,
                      ticket_count: ticketChunk.length,
                      duration_ms: chunkDuration,
                    });

                    trackTrace(
                      `Sent chunk ${i + 1}/${chunks.length} (${ticketChunk.length} notifications)`,
                      "info",
                      {
                        news_id: newsId,
                        chunk_index: i + 1,
                        duration_ms: chunkDuration,
                      },
                    );
                  } catch (error) {
                    const chunkError =
                      error instanceof Error ? error : new Error(String(error));

                    trackServerException(chunkError, {
                      news_id: newsId,
                      chunk_index: i + 1,
                      chunk_size: chunk.length,
                      error_context: "push_notification_chunk_send",
                    });

                    trackTrace(
                      `Failed to send notification chunk ${i + 1}/${chunks.length}`,
                      "error",
                      {
                        news_id: newsId,
                        chunk_index: i + 1,
                        error: chunkError.message,
                      },
                    );
                  }
                }

                // Check for errors in tickets and clean up invalid tokens
                return await withServerSpan(
                  "process_notification_results",
                  async (resultSpan) => {
                    const errors = tickets.filter(
                      (ticket) => ticket.status === "error",
                    );
                    const successCount = tickets.filter(
                      (t) => t.status === "ok",
                    ).length;
                    const failureCount = errors.length;

                    resultSpan.setAttribute(
                      "notification.success_count",
                      successCount,
                    );
                    resultSpan.setAttribute(
                      "notification.failure_count",
                      failureCount,
                    );

                    if (errors.length > 0) {
                      trackServerEvent("push_notification:errors_detected", {
                        news_id: newsId,
                        error_count: errors.length,
                        total_tickets: tickets.length,
                      });

                      // Remove invalid tokens from database
                      let removedTokenCount = 0;
                      for (let i = 0; i < errors.length; i++) {
                        const ticket = errors[i];
                        if (
                          "details" in ticket &&
                          ticket.details?.error === "DeviceNotRegistered"
                        ) {
                          // Get the corresponding token from the messages array
                          const tokenToRemove = validTokens[i];
                          if (tokenToRemove) {
                            try {
                              await db
                                .delete(pushTokens)
                                .where(
                                  eq(pushTokens.expoPushToken, tokenToRemove),
                                );
                              removedTokenCount++;

                              trackTrace(
                                `Removed invalid device token`,
                                "info",
                                {
                                  news_id: newsId,
                                  token_prefix: tokenToRemove.substring(0, 15),
                                },
                              );
                            } catch (deleteError) {
                              const err =
                                deleteError instanceof Error
                                  ? deleteError
                                  : new Error(String(deleteError));

                              trackServerException(err, {
                                news_id: newsId,
                                error_context: "delete_invalid_token",
                              });
                            }
                          }
                        }
                      }

                      if (removedTokenCount > 0) {
                        trackServerEvent(
                          "push_notification:invalid_tokens_removed",
                          {
                            news_id: newsId,
                            removed_count: removedTokenCount,
                          },
                        );
                      }
                    }

                    const totalDuration = Date.now() - startTime;

                    // Track final results
                    trackServerEvent("push_notification:news_send_completed", {
                      news_id: newsId,
                      success_count: successCount,
                      failure_count: failureCount,
                      total_tokens: validTokens.length,
                      duration_ms: totalDuration,
                      success_rate:
                        tickets.length > 0
                          ? (successCount / tickets.length) * 100
                          : 0,
                    });

                    trackTrace(
                      `Push notifications completed: ${successCount} succeeded, ${failureCount} failed in ${totalDuration}ms`,
                      "info",
                      {
                        news_id: newsId,
                        success_count: successCount,
                        failure_count: failureCount,
                        duration_ms: totalDuration,
                      },
                    );

                    return {
                      success: true,
                      sentCount: successCount,
                      failedCount: failureCount,
                      tickets,
                    };
                  },
                );
              },
            );
          },
        );
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const totalDuration = Date.now() - startTime;

      trackServerException(err, {
        news_id: newsId,
        news_title: newsTitle,
        duration_ms: totalDuration,
        error_context: "push_notification_send",
      });

      trackServerEvent("push_notification:news_send_failed", {
        news_id: newsId,
        error_message: err.message,
        duration_ms: totalDuration,
      });

      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        tickets: [],
      };
    }
  },
);

/**
 * Send notifications to users with active licenses
 */
export async function sendNewsNotificationToLicensedUsers(
  params: Omit<SendNewsNotificationParams, "targetUserIds">,
) {
  try {
    // Get all users with active licenses
    const { licensesTable } = await import("@/db/schema");
    const result = await db.query.licensesTable.findMany({
      where: eq(licensesTable.activated, true),
      columns: {
        userId: true,
      },
    });

    const userIds = result
      .map((license) => license.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      console.log("No licensed users found");
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        tickets: [],
      };
    }

    return sendNewsNotification({
      ...params,
      targetUserIds: userIds,
    });
  } catch (error) {
    console.error("Error in sendNewsNotificationToLicensedUsers:", error);
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      tickets: [],
    };
  }
}

/**
 * Check notification receipts to verify delivery
 * Call this after sending notifications to track delivery status
 */
export async function checkNotificationReceipts(
  ticketIds: string[],
): Promise<void> {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt.status === "error") {
            console.error("Error in receipt:", receipt);

            if (receipt.details?.error === "DeviceNotRegistered") {
              // Token is invalid, remove from database
              // Note: This requires mapping receiptId back to the token
              // In practice, you'd need to store this mapping when sending
              console.log("Device not registered, token should be removed");
            }
          } else if (receipt.status === "ok") {
            console.log("Notification delivered successfully:", receiptId);
          }
        }
      } catch (error) {
        console.error("Error checking receipts:", error);
      }
    }
  } catch (error) {
    console.error("Error in checkNotificationReceipts:", error);
  }
}
