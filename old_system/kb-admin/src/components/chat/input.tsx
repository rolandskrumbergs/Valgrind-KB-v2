"use client";

import type React from "react";
import { useRef, useEffect, useCallback, memo } from "react";
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";
import { cn } from "@/lib/utils";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ArrowUpIcon, StopCircle } from "lucide-react";

function PureInput({
	chatId,
	input,
	setInput,
	status,
	stop,
	setMessages,
	handleSubmit,
	className,
}: {
	chatId: string;
	input: UseChatHelpers["input"];
	setInput: UseChatHelpers["setInput"];
	status: UseChatHelpers["status"];
	stop: () => void;
	setMessages: UseChatHelpers["setMessages"];
	handleSubmit: UseChatHelpers["handleSubmit"];
	className?: string;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { width } = useWindowSize();

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

	const resetHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = "98px";
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (textareaRef.current) {
			const domValue = textareaRef.current.value;
			// Prefer DOM value over localStorage to handle hydration
			const finalValue = domValue || "";
			setInput(finalValue);
			adjustHeight();
		}
		// Only run once after hydration
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(event.target.value);
		adjustHeight();
	};

	const submitForm = useCallback(() => {
		window.history.replaceState({}, "", `/chat/${chatId}`);

		// Call handleSubmit with an event-like object that has preventDefault
		handleSubmit({ preventDefault: () => {} });

		resetHeight();

		if (width && width > 768) {
			textareaRef.current?.focus();
		}
	}, [handleSubmit, width, chatId, resetHeight]);

	return (
		<div className="relative w-full flex flex-col gap-4 bg-muted/50 p-2 rounded-xl">
			<Textarea
				data-testid="multimodal-input"
				ref={textareaRef}
				placeholder="Send a message..."
				value={input}
				onChange={handleInput}
				className={cn(
					"min-h-24 max-h-[calc(50dvh)] overflow-hidden resize-none rounded-lg !text-base bg-muted pb-6 pr-14",
					className,
				)}
				rows={2}
				autoFocus
				onKeyDown={(event) => {
					if (
						event.key === "Enter" &&
						!event.shiftKey &&
						!event.nativeEvent.isComposing
					) {
						event.preventDefault();

						if (status !== "ready") {
							toast.error("Please wait for the model to finish its response!");
						} else {
							submitForm();
						}
					}
				}}
			/>

			<div className="absolute bottom-2 right-2 p-2 w-fit flex flex-row justify-end">
				{status === "submitted" || status === "streaming" ? (
					<StopButton stop={stop} setMessages={setMessages} />
				) : (
					<SendButton input={input} submitForm={submitForm} />
				)}
			</div>
		</div>
	);
}

export const Input = memo(PureInput, (prevProps, nextProps) => {
	if (prevProps.input !== nextProps.input) return false;
	if (prevProps.status !== nextProps.status) return false;

	return true;
});

function PureStopButton({
	stop,
	setMessages,
}: {
	stop: () => void;
	setMessages: UseChatHelpers["setMessages"];
}) {
	return (
		<Button
			data-testid="stop-button"
			className="rounded-md p-1.5 h-fit border dark:border-zinc-600"
			onClick={(event) => {
				event.preventDefault();
				stop();
				setMessages((messages) => messages);
			}}
		>
			<StopCircle size={14} />
		</Button>
	);
}

const StopButton = memo(PureStopButton);

function PureSendButton({
	submitForm,
	input,
}: {
	submitForm: () => void;
	input: string;
}) {
	return (
		<Button
			data-testid="send-button"
			className="rounded-md p-1.5 h-fit border dark:border-zinc-600"
			onClick={(event) => {
				event.preventDefault();
				submitForm();
			}}
			disabled={input.length === 0}
		>
			<ArrowUpIcon size={14} />
		</Button>
	);
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
	if (prevProps.input !== nextProps.input) return false;
	return true;
});
