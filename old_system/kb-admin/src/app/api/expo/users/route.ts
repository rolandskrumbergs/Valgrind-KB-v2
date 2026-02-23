import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatTokensPurchases, coursePurchases, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserById } from "@/db/queries/user-queries";

interface ChatTokenPurchase {
  id: number;
  amount: number;
  type: string;
  createdAt: Date;
}

interface CoursePurchase {
  id: number;
  courseId: number;
  type: string;
  createdAt: Date;
}

interface UserPurchasesResponse {
  chatTokenPurchases: ChatTokenPurchase[];
  coursePurchases: CoursePurchase[];
  totalPurchasedChatTokens: number;
  totalPurchasedCourses: number;
  totalDailyChatTokens: number;
}

export async function GET(request: NextRequest) {
  try {
    if (!request.headers.get("User-ID")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Bad Request: User ID not provided" },
        { status: 400 },
      );
    }

    // Verify user exists
    const userData = await getUserById(userId);

    if (!userData?.data) {
      return NextResponse.json(
        { error: "Not Found: User not found" },
        { status: 404 },
      );
    }

    // Fetch chat token purchases
    const chatTokenPurchasesData = await db
      .select({
        id: chatTokensPurchases.id,
        amount: chatTokensPurchases.amount,
        type: chatTokensPurchases.type,
        createdAt: chatTokensPurchases.createdAt,
      })
      .from(chatTokensPurchases)
      .where(eq(chatTokensPurchases.userId, userId))
      .orderBy(chatTokensPurchases.createdAt);

    // Fetch course purchases with course names
    const coursePurchasesData = await db
      .select({
        id: coursePurchases.id,
        courseId: coursePurchases.courseId,
        type: coursePurchases.type,
        createdAt: coursePurchases.createdAt,
      })
      .from(coursePurchases)
      .leftJoin(courses, eq(coursePurchases.courseId, courses.courseId))
      .where(eq(coursePurchases.userId, userId))
      .orderBy(coursePurchases.createdAt);

    // Calculate totals
    const totalChatTokens = chatTokenPurchasesData.reduce(
      (sum, purchase) => sum + (purchase.amount || 0),
      0,
    );

    const response: UserPurchasesResponse = {
      chatTokenPurchases: chatTokenPurchasesData,
      coursePurchases: coursePurchasesData,
      totalPurchasedChatTokens: totalChatTokens,
      totalPurchasedCourses: coursePurchasesData.length,
      totalDailyChatTokens:
        Number(process.env.DAILY_TOKENS_USAGE_LIMIT) + totalChatTokens,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
