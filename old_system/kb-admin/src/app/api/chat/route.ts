import {
  type UIMessage,
  createDataStreamResponse,
  smoothStream,
  streamText,
  appendResponseMessages,
} from "ai";
import { logger } from "better-auth";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from "@/lib/utils";

import {
  generateTitleFromUserMessage,
  getLenaProfileForChatAction,
} from "@/actions/chat-actions";
import { GetSessionInServer } from "@/actions/auth-action";

import { systemPrompt } from "@/ai/prompts";
import { fa_noggrann_information } from "@/ai/tools";

import type { User } from "@/db/schema";
import {
  getUserById,
  getUserChatTokensPurchasesTotal,
  getUserTotalTokensUsageForToday,
} from "@/db/queries/user-queries";
import type { LenaProfile } from "@/db/queries/lena-queries";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  saveTokenUsage,
} from "@/db/queries/chat-queries";
import { UserRole } from "@/lib/permissions";
import { getLicenseByUserId } from "@/db/queries/license-queries";
import { trackServerEvent, trackServerException } from "@/lib/telemetry-server";

export const runtime = "edge"; // edge runtime is required for streaming responses

// Define a more flexible user type for authentication
type AuthUser = Partial<User> & {
  id: string;
};

type AuthResult = {
  user: AuthUser | null;
  status: "authorized" | "unauthorized";
};

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const RequestAuth = async (request: Request): Promise<AuthResult> => {
  // Get User-ID from header for mobile clients
  const userId = request.headers.get("User-ID");
  let user = null;

  // Try to get session from cookies (web) first
  const session = await GetSessionInServer();

  // If session exists, use it for auth
  if (session?.user?.id) {
    user = session.user;
  }
  // If no session but User-ID header is present, authenticate via header
  else if (userId) {
    const { data: userData } = await getUserById(userId);
    if (userData?.id) {
      user = userData;
    }
  }

  // Return unauthorized status if no valid authentication method
  if (!user?.id) {
    return {
      user: null,
      status: "unauthorized",
    };
  }

  return {
    user: { ...user, role: user.role ? (user.role as UserRole) : undefined },
    status: "authorized",
  };
};

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedProfileID,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedProfileID: string | undefined;
    } = await request.json();

    const authResult = await RequestAuth(request);

    if (authResult.status === "unauthorized" || !authResult.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = authResult.user;

    // Check if user has an active license (only for role 'user')
    if (user.role === "user") {
      const license = await getLicenseByUserId(user.id);
      if (!license?.activated) {
        return new Response("License required", { status: 403 });
      }
    }

    const getLenaProfileResult = await getLenaProfileForChatAction(
      selectedProfileID,
      user as User,
    );

    if (getLenaProfileResult.error) {
      return new Response("Lena profile not found", { status: 400 });
    }

    const lenaProfile = getLenaProfileResult.data as LenaProfile;
    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response("No user message found", { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: user.id, title });
    } else {
      if (chat.userId !== user.id) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: "user",
          parts: userMessage.parts,
          createdAt: new Date(),
          lenaProfile: lenaProfile,
        },
      ],
    });

    // apply rate limiting for user role
    if (user.role === "user") {
      const totalTokensUsed = await getUserTotalTokensUsageForToday(user.id);
      const totalTokensPurchased = await getUserChatTokensPurchasesTotal(
        user.id,
      );

      // Calculate total limit: daily limit + sum of all purchased token amounts
      const totalDailyChatTokens = Number(process.env.DAILY_TOKENS_USAGE_LIMIT);
      const totalTokensAvailable = totalDailyChatTokens + totalTokensPurchased;

      const tokensAvailable = totalTokensUsed < totalTokensAvailable;

      if (!tokensAvailable) {
        return new Response("TOKEN_QUOTA_EXCEEDED", { status: 429 });
      }
    }

    console.log(`Starting chat stream for chat ID: ${id}, user ID: ${user.id}`);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openrouter(lenaProfile?.model || ""),
          system: systemPrompt(user.name || ""),
          messages,
          maxSteps: 6,
          experimental_activeTools: ["fa_noggrann_information"],
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: generateUUID,
          tools: {
            fa_noggrann_information: fa_noggrann_information({
              messageId: userMessage.id,
              chatId: id,
              userId: user.id,
              lenaProfile: lenaProfile,
              userName: user.name || "",
            }),
          },
          toolCallStreaming: true,
          onFinish: async ({ usage, response }) => {
            if (user.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === "assistant",
                  ),
                });

                if (!assistantId) {
                  throw new Error("No assistant message found!");
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      createdAt: new Date(),
                      lenaProfile: lenaProfile,
                    },
                  ],
                });

                // Extract and save token usage information
                if (usage) {
                  const { promptTokens, completionTokens, totalTokens } = usage;
                  await saveTokenUsage({
                    chatId: id,
                    messageId: assistantId,
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    createdAt: new Date(),
                    lenaProfile: lenaProfile,
                    model: response.modelId,
                    userId: user.id,
                  });
                }
              } catch (error) {
                console.error("Failed to save chat", error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: "stream-text",
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        console.error("An error occured, please try again!", error);
        trackServerEvent("ChatFailed", {
          batch_type: "chat-stream",
          status: "failed",
        });

        trackServerException(error as unknown as Error, {
          operation: "chatStream",
          severity: "high",
          retry_attempted: false,
        });

        return "Oops, an error occured!";
      },
    });
  } catch (error) {
    logger.error((error as unknown as Error).message);

    console.log("An error occurred while processing the chat request", error);

    trackServerException(error as unknown as Error, {
      operation: "chatStreamGlobal",
      severity: "high",
      retry_attempted: false,
    });

    return new Response("An error occurred while processing your request!", {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const authResult = await RequestAuth(request);

  if (authResult.status === "unauthorized" || !authResult.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = authResult.user;

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    console.error("Failed to delete chat", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
