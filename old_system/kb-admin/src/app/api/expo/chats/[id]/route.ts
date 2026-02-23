import { NextResponse } from "next/server";
import { getChatById, getMessagesByChatId } from "@/db/queries/chat-queries";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// Get params and await before using
		const { id: chatId } = await params;

		if (!chatId) {
			return NextResponse.json(
				{ error: "Unauthorized: Chat ID not provided" },
				{ status: 401 },
			);
		}

		const chatData = await getChatById({ id: chatId });

		if (!chatData) {
			return NextResponse.json(
				{ error: "Unauthorized: Chat not found" },
				{ status: 401 },
			);
		}

		const messages = await getMessagesByChatId({ id: chatId });

		if (!messages) {
			return NextResponse.json(
				{ error: "Unauthorized: Messages not found" },
				{ status: 401 },
			);
		}

		const uiMessages = convertToUIMessages(messages);

		return NextResponse.json(
			{ chat: chatData, messages: uiMessages },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching chat:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
