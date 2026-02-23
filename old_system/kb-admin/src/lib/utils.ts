import type {
	CoreAssistantMessage,
	CoreToolMessage,
	Message,
	UIMessage,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Message as DBMessage } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

interface ApplicationError extends Error {
	info: string;
	status: number;
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
	const res = await fetch(url);

	if (!res.ok) {
		const error = new Error(
			"An error occurred while fetching the data.",
		) as ApplicationError;

		error.info = await res.json();
		error.status = res.status;

		throw error;
	}

	return res.json();
};

export function generateUUID(): string {
	return uuidv4();
	// return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
	// 	const r = (Math.random() * 16) | 0;
	// 	const v = c === "x" ? r : (r & 0x3) | 0x8;
	// 	return v.toString(16);
	// });
}

function addToolMessageToChat({
	toolMessage,
	messages,
}: {
	toolMessage: CoreToolMessage;
	messages: Array<Message>;
}): Array<Message> {
	return messages.map((message) => {
		if (message.toolInvocations) {
			return {
				...message,
				toolInvocations: message.toolInvocations.map((toolInvocation) => {
					const toolResult = toolMessage.content.find(
						(tool) => tool.toolCallId === toolInvocation.toolCallId,
					);

					if (toolResult) {
						return {
							...toolInvocation,
							state: "result",
							result: toolResult.result,
						};
					}

					return toolInvocation;
				}),
			};
		}

		return message;
	});
}

export function convertToUIMessages(
	messages: Array<DBMessage>,
): Array<UIMessage> {
	return messages.map((message) => ({
		id: message.id,
		parts: message.parts as UIMessage["parts"],
		role: message.role as UIMessage["role"],
		// Note: content will soon be deprecated in @ai-sdk/react
		content: "",
		createdAt: message.createdAt,
	}));
}

export function getMostRecentUserMessage(messages: Array<Message>) {
	const userMessages = messages.filter((message) => message.role === "user");
	return userMessages.at(-1);
}

/**
 * Formats file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function getTrailingMessageId({
	messages,
}: {
	messages: Array<ResponseMessage>;
}): string | null {
	const trailingMessage = messages.at(-1);

	if (!trailingMessage) return null;

	return trailingMessage.id;
}

export const formatTimeSince = (date: Date) => {
	const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

	let interval = seconds / 31536000; // seconds in a year
	if (interval > 1) return `${Math.floor(interval)} years ago`;

	interval = seconds / 2592000; // seconds in a month
	if (interval > 1) return `${Math.floor(interval)} months ago`;

	interval = seconds / 86400; // seconds in a day
	if (interval > 1) return `${Math.floor(interval)} days ago`;

	interval = seconds / 3600; // seconds in an hour
	if (interval > 1) return `${Math.floor(interval)} hours ago`;

	interval = seconds / 60; // seconds in a minute
	if (interval > 1) return `${Math.floor(interval)} minutes ago`;

	return `${Math.floor(seconds)} seconds ago`;
};
