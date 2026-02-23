import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

/**
 * Register or update push token for a user
 * POST /api/expo/push-tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, expoPushToken, platform } = await request.json();

    // Validate required fields
    if (!userId || !expoPushToken || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: userId, expoPushToken, platform" },
        { status: 400 },
      );
    }

    // Verify user ID from headers matches request body
    const headerUserId = request.headers.get("User-ID");
    if (headerUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate platform
    if (!["ios", "android"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'ios' or 'android'" },
        { status: 400 },
      );
    }

    // Validate Expo push token format
    if (!Expo.isExpoPushToken(expoPushToken)) {
      return NextResponse.json(
        { error: "Invalid Expo push token format" },
        { status: 400 },
      );
    }

    // Check if token already exists
    const existingToken = await db.query.pushTokens.findFirst({
      where: eq(pushTokens.expoPushToken, expoPushToken),
    });

    if (existingToken) {
      // Update existing token
      await db
        .update(pushTokens)
        .set({
          userId,
          platform,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.expoPushToken, expoPushToken));
    } else {
      // Insert new token
      await db.insert(pushTokens).values({
        userId,
        expoPushToken,
        platform,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Error storing push token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Remove push token (e.g., on logout)
 * DELETE /api/expo/push-tokens
 */
export async function DELETE(request: NextRequest) {
  try {
    const { expoPushToken } = await request.json();

    if (!expoPushToken) {
      return NextResponse.json(
        { error: "Missing required field: expoPushToken" },
        { status: 400 },
      );
    }

    // Delete the token
    await db
      .delete(pushTokens)
      .where(eq(pushTokens.expoPushToken, expoPushToken));

    return NextResponse.json({
      success: true,
      message: "Push token removed successfully",
    });
  } catch (error) {
    console.error("Error removing push token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
