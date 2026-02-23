"use client";

import type { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import useSWR, { useSWRConfig } from "swr";
import { ChatHeader } from "@/components/chat/chat-header";
import type { Vote } from "@/db/schema";
import { fetcher } from "@/lib/utils";
import { Input } from "./input";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Messages } from "./messages";
import { useState } from "react";
import type { LenaProfile } from "@/db/queries/lena-queries";

export function Chat({
	id,
	initialMessages,
	lenaProfile,
}: {
	id: string;
	initialMessages: Array<Message>;
	lenaProfile: LenaProfile | undefined;
}) {
	const { mutate } = useSWRConfig();
	const [isUsingTool, setIsUsingTool] = useState(false);
	const [selectedProfileID, setSelectedProfileID] = useState<
		string | undefined
	>(undefined);

	const {
		messages,
		setMessages,
		handleSubmit,
		input,
		setInput,
		append,
		status,
		stop,
		reload,
	} = useChat({
		id,
		body: { id, selectedProfileID },
		initialMessages,
		experimental_throttle: 100,
		sendExtraMessageFields: true,
		generateId: () => uuidv4(),
		onToolCall: () => {
			setIsUsingTool(true);
		},
		onFinish: () => {
			mutate("/api/history");
			setIsUsingTool(false);
		},
		onError: (error) => {
			console.error("An error occured, please try again!", error);
			toast.error("An error occured, please try again!");
			setIsUsingTool(false);
		},
	});

	const { data: votes } = useSWR<Array<Vote>>(
		`/api/vote?chatId=${id}`,
		fetcher,
	);

	return (
		<div className="flex flex-col min-w-0 h-full max-h-[calc(100dvh-5rem)]">
			<ChatHeader
				setSelectedProfileID={setSelectedProfileID}
				lenaProfile={lenaProfile}
			/>
			<Messages
				chatId={id}
				status={status}
				votes={votes}
				messages={messages}
				setMessages={setMessages}
				reload={reload}
				append={append}
				isUsingTool={isUsingTool}
			/>

			<form className="flex mx-auto gap-2 w-full md:max-w-3xl">
				<Input
					chatId={id}
					input={input}
					setInput={setInput}
					handleSubmit={handleSubmit}
					status={status}
					stop={stop}
					setMessages={setMessages}
				/>
			</form>
		</div>
	);
}
