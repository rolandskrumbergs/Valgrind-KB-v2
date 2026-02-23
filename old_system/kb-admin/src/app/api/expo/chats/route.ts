import { type NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/db/queries/user-queries";
import {
  getAllChatsByUserId,
  getChatsByUserId,
} from "@/db/queries/expo-queries";

interface Chat {
  id: string;
  createdAt: Date;
  title: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header
    const userId = request.headers.get("User-ID");
    const count = request.headers.get("Count");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID not provided" },
        { status: 401 },
      );
    }

    const userData = await getUserById(userId);

    if (!userData) {
      return NextResponse.json(
        { error: "Unauthorized: User not found" },
        { status: 401 },
      );
    }

    let chats: Chat[];

    if (!count) {
      chats = await getAllChatsByUserId({ id: userId });
    } else {
      const parsedCount = Number.parseInt(count);
      if (Number.isNaN(parsedCount)) {
        return NextResponse.json(
          { error: "Invalid count parameter" },
          { status: 400 },
        );
      }
      chats = await getChatsByUserId({ id: userId, limit: parsedCount });
    }

    // If news is an error object, return it
    if (!Array.isArray(chats)) {
      return NextResponse.json(chats, { status: 400 });
    }

    return NextResponse.json({ chats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
