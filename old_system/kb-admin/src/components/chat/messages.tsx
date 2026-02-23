import type { UIMessage } from "ai";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { memo, useState, useEffect, useCallback, useRef } from "react";
import type { Vote } from "@/db/schema";
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { ThinkingMessage, UsingToolMessage, WritingMessage } from "./message";
import { PreviewMessage } from "./message";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

interface MessagesProps {
	chatId: string;
	status: UseChatHelpers["status"];
	votes: Array<Vote> | undefined;
	messages: Array<UIMessage>;
	setMessages: UseChatHelpers["setMessages"];
	reload: UseChatHelpers["reload"];
	isUsingTool: boolean;
	append: UseChatHelpers["append"];
}

function PureMessages({
	chatId,
	status,
	votes,
	messages,
	setMessages,
	reload,
	isUsingTool,
	append,
}: MessagesProps) {
	const [messagesContainerRef, messagesEndRef] =
		useScrollToBottom<HTMLDivElement>();
	const [showScrollButton, setShowScrollButton] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const handleScrollCheck = useCallback(() => {
		// Find the actual scrollable element (viewport)
		const scrollViewport = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);

		if (scrollViewport) {
			const { scrollTop, scrollHeight, clientHeight } =
				scrollViewport as HTMLDivElement;
			// Show button when not at bottom (with some small threshold)
			const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
			setShowScrollButton(!isAtBottom);
		}
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messagesEndRef]);

	useEffect(() => {
		// Find the actual scrollable element (viewport)
		const scrollViewport = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);

		if (scrollViewport) {
			scrollViewport.addEventListener("scroll", handleScrollCheck);

			// Initial check
			handleScrollCheck();

			// Also check after content changes that might affect scroll position
			const observer = new MutationObserver(handleScrollCheck);
			observer.observe(messagesContainerRef.current as Node, {
				childList: true,
				subtree: true,
			});

			return () => {
				scrollViewport.removeEventListener("scroll", handleScrollCheck);
				observer.disconnect();
			};
		}
	}, [handleScrollCheck, messagesContainerRef]);

	// Check scroll position when new messages are added
	useEffect(() => {
		handleScrollCheck();
	}, [handleScrollCheck]);

	return (
		<ScrollArea
			ref={scrollAreaRef}
			className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto relative"
		>
			<div
				className="flex flex-col gap-6 pt-8 pb-10"
				ref={messagesContainerRef}
			>
				{messages.length === 0 && (
					<SuggestedActions append={append} chatId={chatId} />
				)}

				{messages.map((message, index) => (
					<PreviewMessage
						key={message.id}
						chatId={chatId}
						message={message}
						isLoading={status === "streaming" && messages.length - 1 === index}
						vote={
							votes
								? votes.find((vote) => vote.messageId === message.id)
								: undefined
						}
						setMessages={setMessages}
						reload={reload}
					/>
				))}

				{status === "submitted" &&
					messages.length > 0 &&
					messages[messages.length - 1].role === "user" && <ThinkingMessage />}

				{isUsingTool && <UsingToolMessage />}

				<div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-0" />
			</div>

			{showScrollButton && (
				<Button
					className="absolute bottom-4 mx-auto right-0 left-0 p-2 rounded-full shadow-md z-10 bg-foreground/50 backdrop-blur-sm text-background"
					size="icon"
					onClick={scrollToBottom}
					aria-label="Scroll to bottom"
				>
					<ChevronDown className="h-4 w-4" />
				</Button>
			)}
			<div className="bg-gradient-to-b from-background to-transparent h-8 absolute top-0 w-full" />
			<div className="bg-gradient-to-t from-background to-transparent h-10 absolute bottom-0 w-full" />
		</ScrollArea>
	);
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
	if (prevProps.status !== nextProps.status) return false;
	if (prevProps.status && nextProps.status) return false;
	if (prevProps.messages.length !== nextProps.messages.length) return false;
	if (!equal(prevProps.messages, nextProps.messages)) return false;
	if (!equal(prevProps.votes, nextProps.votes)) return false;

	return true;
});
