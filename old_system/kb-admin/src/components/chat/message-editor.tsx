"use client";

import type { UIMessage } from "ai";
import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { Textarea } from "../ui/textarea";
import type { UseChatHelpers } from "@ai-sdk/react";
import { deleteTrailingMessages } from "@/actions/chat-actions";
import { Button } from "../ui/button";

export type MessageEditorProps = {
	message: UIMessage;
	setMode: Dispatch<SetStateAction<"view" | "edit">>;
	setMessages: UseChatHelpers["setMessages"];
	reload: UseChatHelpers["reload"];
};

export function MessageEditor({
	message,
	setMode,
	setMessages,
	reload,
}: MessageEditorProps) {
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const [draftContent, setDraftContent] = useState<string>(() => {
		const textPart = message.parts?.find((part) => part.type === "text");
		return textPart?.text ?? "";
	});

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (textareaRef.current) {
			adjustHeight();
		}
	}, []);

	const adjustHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
		}
	};

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDraftContent(event.target.value);
		adjustHeight();
	};

	return (
		<div className="flex flex-col w-full relative">
			<Textarea
				data-testid="message-editor"
				ref={textareaRef}
				className="bg-muted outline-none border-none overflow-hidden resize-none !text-base rounded-xl w-full pb-10"
				value={draftContent}
				onChange={handleInput}
			/>

			<div className="flex flex-row gap-2 justify-end p-2 pt-0 absolute bottom-0 right-0">
				<button
					type="button"
					className="py-1 px-3 hover:bg-background text-foreground/80 rounded-xl cursor-pointer text-sm bg-muted transition-all"
					onClick={() => {
						setMode("view");
					}}
				>
					Cancel
				</button>
				<Button
					variant="default"
					size="sm"
					data-testid="message-editor-send-button"
					className="py-1 px-3 bg-foreground text-background rounded-xl cursor-pointer text-sm "
					disabled={isSubmitting || !draftContent.trim()}
					onClick={async () => {
						setIsSubmitting(true);

						await deleteTrailingMessages({
							id: message.id,
						});

						// @ts-expect-error todo: support UIMessage in setMessages
						setMessages((messages) => {
							const index = messages.findIndex((m) => m.id === message.id);

							if (index !== -1) {
								const updatedMessage = {
									...message,
									content: draftContent,
									parts: [{ type: "text", text: draftContent }],
								};

								return [...messages.slice(0, index), updatedMessage];
							}

							return messages;
						});

						setMode("view");
						reload();
					}}
				>
					{isSubmitting ? "Sending..." : "Send"}
				</Button>
			</div>
		</div>
	);
}
