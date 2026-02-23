import {
  getUserTotalTokensUsageForToday,
  getUserChatTokensPurchasesTotal,
} from "@/db/queries/user-queries";

export async function GET(request: Request) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const totalTokensUsed = await getUserTotalTokensUsageForToday(userId);
  const totalTokensPurchased = await getUserChatTokensPurchasesTotal(userId);

  // Calculate total limit: daily limit + sum of all purchased token amounts
  const totalDailyChatTokens = Number(process.env.DAILY_TOKENS_USAGE_LIMIT);
  const totalTokensAvailable = totalDailyChatTokens + totalTokensPurchased;

  const tokensAvailable = totalTokensUsed < totalTokensAvailable;

  return Response.json({
    tokensAvailable,
    totalTokensUsed,
    totalTokensPurchased,
    totalTokensAvailable,
    totalDailyChatTokens,
  });
}
