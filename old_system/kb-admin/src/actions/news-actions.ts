"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { newsTable } from "@/db/schema";
import { GetSessionInServer, CheckPermissionOfUser } from "./auth-action";
import type { AddNewsFormType } from "@/schema";
import {
  getAllNews,
  getNewsById,
  updateNewsStatus,
  deleteNews,
  updateNews,
  getTargetUserIdsForNews,
} from "@/db/queries/news-queries";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  extractS3KeyFromUrl,
  getS3Client,
  deleteFileFromS3,
} from "@/lib/s3-utils";
import { uploadImageToS3Action } from "./common-actions";
import {
  withTelemetry,
  trackServerEvent,
  trackServerException,
  trackTrace,
  withServerSpan,
} from "@/lib/telemetry-server";

// Environment variables
const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const AWS_NEWS_BUCKET = process.env.AWS_NEWS_BUCKET || "";

/**
 * Upload image to S3 bucket
 */
export const uploadNewsImage = withTelemetry(
  "uploadNewsImage",
  async (file: File): Promise<string> => {
    trackServerEvent("news:image_upload_started", {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    });

    const startTime = Date.now();

    try {
      const url = await uploadImageToS3Action(
        file,
        AWS_NEWS_BUCKET,
        AWS_REGION,
        "images/",
      );

      const duration = Date.now() - startTime;

      trackServerEvent("news:image_upload_completed", {
        file_name: file.name,
        file_size: file.size,
        duration_ms: duration,
        url_length: url.length,
      });

      trackTrace(`News image uploaded successfully: ${file.name}`, "info", {
        file_size: file.size,
        duration_ms: duration,
      });

      return url;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        file_name: file.name,
        file_size: file.size,
        duration_ms: duration,
        error_context: "news_image_upload",
      });

      throw error;
    }
  },
);

/**
 * Upload PDF file to S3 bucket
 */
export const uploadNewsPdf = withTelemetry(
  "uploadNewsPdf",
  async (
    file: File,
  ): Promise<{
    fileName: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
  }> => {
    const startTime = Date.now();

    trackServerEvent("news:pdf_upload_started", {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    });

    if (!AWS_NEWS_BUCKET) {
      const error = new Error(
        "AWS_NEWS_BUCKET environment variable is not set",
      );
      trackServerException(error, {
        error_context: "news_pdf_upload_config",
      });
      throw error;
    }

    const client = getS3Client();

    // Create a unique file key
    const timestamp = Date.now();
    const key = `files/${timestamp}-${file.name}`;

    try {
      return await withServerSpan("upload_pdf_to_s3", async (span) => {
        span.setAttribute("s3.bucket", AWS_NEWS_BUCKET);
        span.setAttribute("s3.key", key);
        span.setAttribute("file.size", file.size);

        // Get file buffer
        const fileBuffer = await file.arrayBuffer();

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: AWS_NEWS_BUCKET,
          Key: key,
          Body: Buffer.from(fileBuffer),
          ContentType: file.type,
          ACL: "public-read",
        });

        await client.send(uploadCommand);

        // Create S3 URL
        const s3Url = `https://${AWS_NEWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        const duration = Date.now() - startTime;

        trackServerEvent("news:pdf_upload_completed", {
          file_name: file.name,
          file_size: file.size,
          s3_key: key,
          duration_ms: duration,
        });

        trackTrace(`News PDF uploaded successfully: ${file.name}`, "info", {
          file_size: file.size,
          duration_ms: duration,
        });

        return {
          fileName: file.name,
          fileSize: file.size,
          s3Key: key,
          s3Url,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        file_name: file.name,
        file_size: file.size,
        s3_key: key,
        duration_ms: duration,
        error_context: "news_pdf_upload_to_s3",
      });

      throw error;
    }
  },
);

/**
 * Add a new news post with files
 */
export const addNews = withTelemetry(
  "addNews",
  async (
    data: AddNewsFormType & {
      excludedCustomers: string[];
      image?: File | null;
      pdfs?: File[];
      status: "draft" | "published";
    },
  ) => {
    const startTime = Date.now();

    trackServerEvent("news:create_started", {
      status: data.status,
      has_image: !!data.image,
      pdf_count: data.pdfs?.length || 0,
      excluded_customers_count: data.excludedCustomers.length,
      title_length: data.title.length,
      content_length: data.content?.length || 0,
    });

    try {
      // Check user session and authorization
      return await withServerSpan(
        "check_news_create_authorization",
        async (span) => {
          const session = await GetSessionInServer();

          if (!session) {
            trackServerEvent("news:create_unauthorized", {
              reason: "no_session",
            });
            return { error: "You must be logged in to create news" };
          }

          span.setAttribute("user.id", session.user.id);
          span.setAttribute("user.role", session.user.role || "unknown");

          // Check if user has permission to create news
          const canCreate = await CheckPermissionOfUser(
            session.user.id,
            "news",
            "create",
          );

          if (!canCreate) {
            trackServerEvent("news:create_unauthorized", {
              user_id: session.user.id,
              user_role: session.user.role || "unknown",
              reason: "no_permission",
            });
            return { error: "You are not authorized to create news" };
          }

          // Upload image if provided
          return await withServerSpan(
            "upload_news_assets",
            async (assetSpan) => {
              let featuredImage = undefined;
              if (data.image) {
                assetSpan.setAttribute("has_featured_image", true);
                featuredImage = await uploadNewsImage(data.image);
              }

              // Upload PDFs if provided
              const pdfFiles: {
                fileName: string;
                fileSize: number;
                s3Key: string;
                s3Url: string;
              }[] = [];
              if (data.pdfs && data.pdfs.length > 0) {
                assetSpan.setAttribute("pdf_count", data.pdfs.length);
                for (let i = 0; i < data.pdfs.length; i++) {
                  const pdf = data.pdfs[i];
                  trackTrace(
                    `Uploading PDF ${i + 1}/${data.pdfs.length}`,
                    "info",
                    { pdf_name: pdf.name },
                  );
                  const pdfData = await uploadNewsPdf(pdf);
                  pdfFiles.push(pdfData);
                }
              }

              // Create news post in database
              return await withServerSpan(
                "insert_news_to_database",
                async (dbSpan) => {
                  dbSpan.setAttribute("news.status", data.status);
                  dbSpan.setAttribute(
                    "news.excluded_customers",
                    data.excludedCustomers.length,
                  );

                  const news = await db
                    .insert(newsTable)
                    .values({
                      title: data.title,
                      content: data.content,
                      featuredImage,
                      pdfFiles,
                      excludedCustomers: data.excludedCustomers,
                      status: data.status,
                      userName: session.user.name,
                      userRole: session.user.role,
                    })
                    .returning();

                  const duration = Date.now() - startTime;

                  trackServerEvent("news:create_completed", {
                    news_id: news[0].id,
                    status: data.status,
                    user_id: session.user.id,
                    has_image: !!featuredImage,
                    pdf_count: pdfFiles.length,
                    duration_ms: duration,
                  });

                  trackTrace(
                    `News created successfully: ${news[0].title}`,
                    "info",
                    {
                      news_id: news[0].id,
                      status: data.status,
                      duration_ms: duration,
                    },
                  );

                  return { success: true, news: news[0] };
                },
              );
            },
          );
        },
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        title: data.title,
        status: data.status,
        duration_ms: duration,
        error_context: "news_create",
      });

      trackTrace(`Failed to create news: ${err.message}`, "error", {
        duration_ms: duration,
      });

      return { error: "Failed to create news post" };
    }
  },
);

export const getNewsAction = withTelemetry("getNewsAction", async () => {
  const startTime = Date.now();

  trackServerEvent("news:fetch_all_started", {});

  try {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      trackServerEvent("news:fetch_all_unauthorized", {
        reason: "no_session",
      });
      return { error: "You are not logged in" };
    }

    const canViewNews = await CheckPermissionOfUser(
      sessionData.user.id,
      "news",
      "read",
    );

    if (!canViewNews.success) {
      trackServerEvent("news:fetch_all_unauthorized", {
        user_id: sessionData.user.id,
        reason: "no_permission",
      });
      return { error: "You do not have permission to view news" };
    }

    return await withServerSpan(
      "fetch_all_news_from_database",
      async (span) => {
        span.setAttribute("user.id", sessionData.user.id);

        const news = await getAllNews();
        const duration = Date.now() - startTime;

        const newsCount = Array.isArray(news) ? news.length : 0;

        trackServerEvent("news:fetch_all_completed", {
          user_id: sessionData.user.id,
          news_count: newsCount,
          duration_ms: duration,
        });

        trackTrace(`Fetched ${newsCount} news items`, "info", {
          user_id: sessionData.user.id,
          duration_ms: duration,
        });

        return news;
      },
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    trackServerException(err, {
      duration_ms: duration,
      error_context: "news_fetch_all",
    });

    throw error;
  }
});

export const getNewsByIdAction = withTelemetry(
  "getNewsByIdAction",
  async (id: string) => {
    const startTime = Date.now();

    trackServerEvent("news:fetch_by_id_started", {
      news_id: id,
    });

    try {
      return await withServerSpan("fetch_news_by_id", async (span) => {
        span.setAttribute("news.id", id);

        const news = await getNewsById(id);
        const duration = Date.now() - startTime;

        if (!news) {
          trackServerEvent("news:fetch_by_id_not_found", {
            news_id: id,
            duration_ms: duration,
          });

          trackTrace(`News not found: ${id}`, "warn", {
            news_id: id,
          });

          return { error: "News not found" };
        }

        trackServerEvent("news:fetch_by_id_completed", {
          news_id: id,
          news_status: news.status,
          duration_ms: duration,
        });

        trackTrace(`Fetched news: ${news.title}`, "info", {
          news_id: id,
          duration_ms: duration,
        });

        return news;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        news_id: id,
        duration_ms: duration,
        error_context: "news_fetch_by_id",
      });

      throw error;
    }
  },
);

export const updateNewsStatusAction = withTelemetry(
  "updateNewsStatusAction",
  async (id: string, status: "published" | "draft") => {
    const startTime = Date.now();

    trackServerEvent("news:update_status_started", {
      news_id: id,
      new_status: status,
    });

    try {
      return await withServerSpan(
        "check_update_status_authorization",
        async (span) => {
          const sessionData = await GetSessionInServer();
          if (!sessionData) {
            trackServerEvent("news:update_status_unauthorized", {
              news_id: id,
              reason: "no_session",
            });
            return { error: "You are not logged in" };
          }

          span.setAttribute("user.id", sessionData.user.id);
          span.setAttribute("news.id", id);
          span.setAttribute("news.new_status", status);

          const canUpdateNews = await CheckPermissionOfUser(
            sessionData.user.id,
            "news",
            "update",
          );

          if (!canUpdateNews.success) {
            trackServerEvent("news:update_status_unauthorized", {
              news_id: id,
              user_id: sessionData.user.id,
              reason: "no_permission",
            });
            return { error: "You do not have permission to update news" };
          }

          return await withServerSpan(
            "update_news_status_in_database",
            async (updateSpan) => {
              const result = await updateNewsStatus(id, status);

              if (!result.success) {
                trackServerEvent("news:update_status_failed", {
                  news_id: id,
                  new_status: status,
                  error: result.error || "unknown_error",
                });
                return {
                  error: result.error || "Failed to update news status",
                };
              }

              updateSpan.setAttribute("update.success", true);

              const duration = Date.now() - startTime;

              trackServerEvent("news:update_status_completed", {
                news_id: id,
                new_status: status,
                user_id: sessionData.user.id,
                duration_ms: duration,
              });

              trackTrace(
                `News status updated to ${status}: ${result.data?.title}`,
                "info",
                {
                  news_id: id,
                  new_status: status,
                  duration_ms: duration,
                },
              );

              // Send push notifications when news is published
              if (status === "published" && result.data) {
                try {
                  return await withServerSpan(
                    "trigger_push_notifications",
                    async (notifSpan) => {
                      const { sendNewsNotification } = await import(
                        "@/lib/push-notification-service"
                      );

                      // Get target user IDs based on excluded customers
                      const excludedCustomerIds =
                        result.data.excludedCustomers || [];
                      const targetUserIds =
                        await getTargetUserIdsForNews(excludedCustomerIds);

                      notifSpan.setAttribute(
                        "notification.target_count",
                        targetUserIds.length,
                      );

                      trackTrace(
                        `Sending notifications to ${targetUserIds.length} users for news: ${result.data.id}`,
                        "info",
                        {
                          newsId: result.data.id,
                          targetUserCount: targetUserIds.length,
                          action: "news_published",
                        },
                      );

                      // Strip HTML tags from content and get first 100 characters
                      const plainTextContent = result.data.content
                        ?.replace(/<[^>]*>/g, "")
                        .replace(/&nbsp;/g, " ")
                        .replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, '"')
                        .trim();
                      const newsExcerpt = plainTextContent?.substring(0, 100);

                      // Send notification asynchronously (don't block the response)
                      sendNewsNotification({
                        newsId: result.data.id,
                        newsTitle: result.data.title,
                        newsExcerpt,
                        targetUserIds,
                      }).catch((error) => {
                        trackTrace(
                          "Failed to send push notifications",
                          "error",
                          {
                            newsId: result.data.id,
                            error:
                              error instanceof Error
                                ? error.message
                                : String(error),
                          },
                        );
                      });

                      trackTrace(
                        "Push notification triggered for news",
                        "info",
                        {
                          newsId: result.data.id,
                        },
                      );

                      return { success: true, news: result.data };
                    },
                  );
                } catch (error) {
                  // Log but don't fail the status update if notification fails
                  trackTrace("Error triggering push notification", "error", {
                    newsId: result.data.id,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                  return { success: true, news: result.data };
                }
              }

              return { success: true, news: result.data };
            },
          );
        },
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        news_id: id,
        new_status: status,
        duration_ms: duration,
        error_context: "news_update_status",
      });

      throw error;
    }
  },
);

export const deleteNewsAction = withTelemetry(
  "deleteNewsAction",
  async (id: string) => {
    const startTime = Date.now();

    trackServerEvent("news:delete_started", {
      news_id: id,
    });

    try {
      return await withServerSpan(
        "check_delete_authorization",
        async (span) => {
          const sessionData = await GetSessionInServer();
          if (!sessionData) {
            trackServerEvent("news:delete_unauthorized", {
              news_id: id,
              reason: "no_session",
            });
            return { error: "You are not logged in" };
          }

          span.setAttribute("user.id", sessionData.user.id);
          span.setAttribute("news.id", id);

          const canDeleteNews = await CheckPermissionOfUser(
            sessionData.user.id,
            "news",
            "delete",
          );

          if (!canDeleteNews.success) {
            trackServerEvent("news:delete_unauthorized", {
              news_id: id,
              user_id: sessionData.user.id,
              reason: "no_permission",
            });
            return { error: "You do not have permission to delete news" };
          }

          // Get the news post to access its files before deletion
          return await withServerSpan(
            "fetch_news_for_deletion",
            async (fetchSpan) => {
              const newsToDelete = await getNewsById(id);

              if (!newsToDelete) {
                trackServerEvent("news:delete_not_found", {
                  news_id: id,
                });
                return { error: "News not found" };
              }

              fetchSpan.setAttribute("news.title", newsToDelete.title);
              fetchSpan.setAttribute(
                "news.has_image",
                !!newsToDelete.featuredImage,
              );
              fetchSpan.setAttribute(
                "news.pdf_count",
                newsToDelete.pdfFiles?.length || 0,
              );

              // Delete associated S3 files if they exist
              return await withServerSpan(
                "delete_news_s3_files",
                async (s3Span) => {
                  let deletedImageCount = 0;
                  let deletedPdfCount = 0;

                  try {
                    // Delete featured image if exists
                    if (newsToDelete.featuredImage) {
                      const imageKey = extractS3KeyFromUrl(
                        newsToDelete.featuredImage,
                      );
                      if (imageKey) {
                        await deleteFileFromS3(imageKey, AWS_NEWS_BUCKET);
                        deletedImageCount++;
                        trackTrace(
                          `Deleted news featured image from S3`,
                          "info",
                          { news_id: id, s3_key: imageKey },
                        );
                      }
                    }

                    // Delete PDF files if they exist
                    if (
                      newsToDelete.pdfFiles &&
                      newsToDelete.pdfFiles.length > 0
                    ) {
                      for (const pdf of newsToDelete.pdfFiles) {
                        await deleteFileFromS3(pdf.s3Key, AWS_NEWS_BUCKET);
                        deletedPdfCount++;
                        trackTrace(
                          `Deleted news PDF from S3: ${pdf.fileName}`,
                          "info",
                          { news_id: id, s3_key: pdf.s3Key },
                        );
                      }
                    }

                    s3Span.setAttribute("s3.deleted_images", deletedImageCount);
                    s3Span.setAttribute("s3.deleted_pdfs", deletedPdfCount);

                    trackServerEvent("news:s3_files_deleted", {
                      news_id: id,
                      deleted_images: deletedImageCount,
                      deleted_pdfs: deletedPdfCount,
                    });
                  } catch (error) {
                    const err =
                      error instanceof Error ? error : new Error(String(error));
                    trackServerException(err, {
                      news_id: id,
                      error_context: "news_delete_s3_files",
                    });
                    trackTrace(
                      "Error deleting S3 files, continuing with database deletion",
                      "warn",
                      { news_id: id, error: err.message },
                    );
                    // Continue with deletion even if S3 deletion fails
                  }

                  // Delete from database
                  return await withServerSpan(
                    "delete_news_from_database",
                    async (dbSpan) => {
                      const result = await deleteNews(id);

                      if (!result.success) {
                        trackServerEvent("news:delete_failed", {
                          news_id: id,
                          error: result.error || "unknown_error",
                        });
                        return {
                          error: result.error || "Failed to delete news",
                        };
                      }

                      const duration = Date.now() - startTime;

                      trackServerEvent("news:delete_completed", {
                        news_id: id,
                        news_title: newsToDelete.title,
                        user_id: sessionData.user.id,
                        deleted_images: deletedImageCount,
                        deleted_pdfs: deletedPdfCount,
                        duration_ms: duration,
                      });

                      trackTrace(
                        `News deleted successfully: ${newsToDelete.title}`,
                        "info",
                        {
                          news_id: id,
                          duration_ms: duration,
                        },
                      );

                      revalidatePath("/news");
                      redirect("/news");
                    },
                  );
                },
              );
            },
          );
        },
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        news_id: id,
        duration_ms: duration,
        error_context: "news_delete",
      });

      throw error;
    }
  },
);

/**
 * Update an existing news post with files
 */
export const updateNewsAction = withTelemetry(
  "updateNewsAction",
  async (
    id: string,
    data: AddNewsFormType & {
      excludedCustomers: string[];
      image?: File | null;
      removedImage?: boolean;
      pdfs?: File[];
      existingPdfIds?: string[]; // S3 keys of PDFs to keep
    },
  ) => {
    const startTime = Date.now();

    trackServerEvent("news:update_started", {
      news_id: id,
      has_new_image: !!data.image,
      removed_image: !!data.removedImage,
      new_pdf_count: data.pdfs?.length || 0,
      kept_pdf_count: data.existingPdfIds?.length || 0,
      title_length: data.title.length,
      content_length: data.content?.length || 0,
    });

    try {
      // Check user session and authorization
      return await withServerSpan(
        "check_update_authorization",
        async (span) => {
          const session = await GetSessionInServer();

          if (!session) {
            trackServerEvent("news:update_unauthorized", {
              news_id: id,
              reason: "no_session",
            });
            return { error: "You must be logged in to update news" };
          }

          span.setAttribute("user.id", session.user.id);
          span.setAttribute("news.id", id);

          // Check if user has permission to update news
          const canUpdate = await CheckPermissionOfUser(
            session.user.id,
            "news",
            "update",
          );

          if (!canUpdate.success) {
            trackServerEvent("news:update_unauthorized", {
              news_id: id,
              user_id: session.user.id,
              reason: "no_permission",
            });
            return { error: "You are not authorized to update news" };
          }

          // Get existing news
          return await withServerSpan(
            "fetch_existing_news",
            async (fetchSpan) => {
              const existingNews = await getNewsById(id);
              if (!existingNews) {
                trackServerEvent("news:update_not_found", {
                  news_id: id,
                });
                return { error: "News not found" };
              }

              fetchSpan.setAttribute("news.title", existingNews.title);
              fetchSpan.setAttribute("news.status", existingNews.status);

              // Handle image update
              return await withServerSpan(
                "update_news_images",
                async (imageSpan) => {
                  let featuredImage = existingNews.featuredImage;
                  let imageOperations = {
                    deleted: false,
                    replaced: false,
                  };

                  // If image is removed, delete it from S3
                  if (data.removedImage && existingNews.featuredImage) {
                    const imageKey = extractS3KeyFromUrl(
                      existingNews.featuredImage,
                    );
                    if (imageKey) {
                      await deleteFileFromS3(imageKey, AWS_NEWS_BUCKET);
                      imageOperations.deleted = true;
                      trackTrace(`Removed featured image from news`, "info", {
                        news_id: id,
                        s3_key: imageKey,
                      });
                    }
                    featuredImage = null;
                  }

                  // If new image is provided, upload it and delete old one if exists
                  if (data.image) {
                    // Delete old image if exists
                    if (existingNews.featuredImage) {
                      const imageKey = extractS3KeyFromUrl(
                        existingNews.featuredImage,
                      );
                      if (imageKey) {
                        await deleteFileFromS3(imageKey, AWS_NEWS_BUCKET);
                        trackTrace(`Replaced old featured image`, "info", {
                          news_id: id,
                          s3_key: imageKey,
                        });
                      }
                    }
                    // Upload new image
                    featuredImage = await uploadNewsImage(data.image);
                    imageOperations.replaced = true;
                  }

                  imageSpan.setAttribute(
                    "image.deleted",
                    imageOperations.deleted,
                  );
                  imageSpan.setAttribute(
                    "image.replaced",
                    imageOperations.replaced,
                  );

                  // Handle PDF updates
                  return await withServerSpan(
                    "update_news_pdfs",
                    async (pdfSpan) => {
                      let pdfFiles = existingNews.pdfFiles || [];
                      let deletedPdfCount = 0;
                      let addedPdfCount = 0;

                      // If existingPdfIds is provided, keep only those PDFs
                      if (data.existingPdfIds) {
                        const keysToKeep = new Set(data.existingPdfIds);

                        // Filter PDFs to remove deleted ones
                        const pdfFilesToKeep = pdfFiles.filter((pdf) =>
                          keysToKeep.has(pdf.s3Key),
                        );

                        // Delete PDFs that were removed
                        for (const pdf of pdfFiles) {
                          if (!keysToKeep.has(pdf.s3Key)) {
                            await deleteFileFromS3(pdf.s3Key, AWS_NEWS_BUCKET);
                            deletedPdfCount++;
                            trackTrace(
                              `Deleted PDF from news: ${pdf.fileName}`,
                              "info",
                              { news_id: id, s3_key: pdf.s3Key },
                            );
                          }
                        }

                        pdfFiles = pdfFilesToKeep;
                      }

                      // Upload new PDFs if provided
                      if (data.pdfs && data.pdfs.length > 0) {
                        for (let i = 0; i < data.pdfs.length; i++) {
                          const pdf = data.pdfs[i];
                          trackTrace(
                            `Uploading new PDF ${i + 1}/${data.pdfs.length}`,
                            "info",
                            { news_id: id, pdf_name: pdf.name },
                          );
                          const pdfData = await uploadNewsPdf(pdf);
                          pdfFiles.push(pdfData);
                          addedPdfCount++;
                        }
                      }

                      pdfSpan.setAttribute(
                        "pdf.deleted_count",
                        deletedPdfCount,
                      );
                      pdfSpan.setAttribute("pdf.added_count", addedPdfCount);
                      pdfSpan.setAttribute("pdf.final_count", pdfFiles.length);

                      if (deletedPdfCount > 0 || addedPdfCount > 0) {
                        trackServerEvent("news:pdfs_updated", {
                          news_id: id,
                          deleted_count: deletedPdfCount,
                          added_count: addedPdfCount,
                          final_count: pdfFiles.length,
                        });
                      }

                      // Update news post in database
                      return await withServerSpan(
                        "update_news_in_database",
                        async (dbSpan) => {
                          const result = await updateNews(id, {
                            title: data.title,
                            content: data.content,
                            featuredImage,
                            pdfFiles,
                            excludedCustomers: data.excludedCustomers,
                          });

                          if (!result.success) {
                            trackServerEvent("news:update_failed", {
                              news_id: id,
                              error: result.error || "unknown_error",
                            });
                            return {
                              error: result.error || "Failed to update news",
                            };
                          }

                          const duration = Date.now() - startTime;

                          trackServerEvent("news:update_completed", {
                            news_id: id,
                            news_title: data.title,
                            user_id: session.user.id,
                            image_deleted: imageOperations.deleted,
                            image_replaced: imageOperations.replaced,
                            pdfs_deleted: deletedPdfCount,
                            pdfs_added: addedPdfCount,
                            final_pdf_count: pdfFiles.length,
                            duration_ms: duration,
                          });

                          trackTrace(
                            `News updated successfully: ${data.title}`,
                            "info",
                            {
                              news_id: id,
                              duration_ms: duration,
                            },
                          );

                          // Revalidate paths to refresh the news page and list
                          revalidatePath(`/news/${id}`);
                          revalidatePath("/news");

                          return { success: true, news: result.data };
                        },
                      );
                    },
                  );
                },
              );
            },
          );
        },
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      trackServerException(err, {
        news_id: id,
        title: data.title,
        duration_ms: duration,
        error_context: "news_update",
      });

      trackTrace(`Failed to update news: ${err.message}`, "error", {
        news_id: id,
        duration_ms: duration,
      });

      return { error: "Failed to update news post" };
    }
  },
);
