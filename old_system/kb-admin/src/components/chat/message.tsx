"use client";

import type { UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import type { Vote } from "@/db/schema";
import equal from "fast-deep-equal";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import {
	AlertCircle,
	BookOpen,
	BookOpenCheck,
	Brain,
	CheckCircle,
	Dot,
	Edit2,
	Loader2,
	Search,
	SearchCheckIcon,
} from "lucide-react";
import { MessageEditor } from "./message-editor";
import { MessageActions } from "./message-actions";
import { Markdown } from "./markdown";
import { cx } from "class-variance-authority";
import type { UseChatHelpers } from "@ai-sdk/react";

const PurePreviewMessage = ({
	chatId,
	message,
	vote,
	isLoading,
	setMessages,
	reload,
}: {
	chatId: string;
	message: UIMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	setMessages: UseChatHelpers["setMessages"];
	reload: UseChatHelpers["reload"];
}) => {
	const [mode, setMode] = useState<"view" | "edit">("view");

	return (
		<AnimatePresence>
			<motion.div
				data-testid={`message-${message.role}`}
				className="w-full mx-auto max-w-3xl px-4 group/message"
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				data-role={message.role}
			>
				<div
					className={cn(
						"flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl px-6",
						{
							"w-full": mode === "edit",
							"group-data-[role=user]/message:w-fit": mode !== "edit",
						},
					)}
				>
					<div className="flex flex-col gap-2 w-full ">
						{message.parts?.map((part, index) => {
							const { type } = part;
							const key = `message-${message.id}-part-${index}`;

							if (type === "text") {
								if (mode === "view") {
									return (
										<div key={key} className="flex flex-col gap-2 items-start">
											<div
												data-testid="message-content"
												className={cn("flex flex-col gap-4", {
													"bg-muted text-foreground px-3 py-2 rounded-xl":
														message.role === "user",
												})}
											>
												<Markdown>{part.text}</Markdown>
											</div>
											{message.role === "user" && (
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															data-testid="message-edit-button"
															className="px-2 h-fit rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-all duration-200 opacity-0 group-hover/message:opacity-100 cursor-pointer self-end"
															onClick={() => {
																setMode("edit");
															}}
														>
															<Edit2 size={16} />
														</button>
													</TooltipTrigger>
													<TooltipContent side="bottom">
														Edit message
													</TooltipContent>
												</Tooltip>
											)}
										</div>
									);
								}

								if (mode === "edit") {
									return (
										<div
											key={key}
											className="flex flex-row gap-2 items-start w-full"
										>
											<MessageEditor
												key={message.id}
												message={message}
												setMode={setMode}
												setMessages={setMessages}
												reload={reload}
											/>
										</div>
									);
								}
							}
							if (type === "tool-invocation") {
								const { toolInvocation } = part;
								const { toolName, toolCallId, state } = toolInvocation;

								if (state === "result") {
									const { result, args } = toolInvocation;

									return (
										<div key={toolCallId}>
											{toolName === "fa_noggrann_information" && (
												<div className="flex flex-col gap-3 items-start my-2 border border-muted/50 bg-muted/20 rounded-2xl p-4">
													<p className="text-xs  italic text-muted-foreground/60">
														{args?.short_summary}
													</p>
													<div className="text-white text-xs flex flex-row gap-2 items-center bg-[#2b5a1aa7] px-3 py-1 rounded-full w-fit">
														<BookOpenCheck size={16} className="text-white" />
														Accessed knowledge base
													</div>
													<div className="flex flex-col gap-2">
														<div className="flex flex-row gap-2 items-center w-fit bg-muted px-3 py-1 rounded-xl">
															<Search size={16} className="shrink-0" />
															<p className="text-xs text-muted-foreground">
																{args?.question}
															</p>
														</div>
													</div>

													{result.status === "error" ? (
														<div className="text-white text-xs flex flex-row gap-2 items-center bg-[#2b5a1aa7] px-3 py-1 rounded-full w-fit">
															<AlertCircle size={16} />
															{result.type === "insufficient-data"
																? "Insufficient data in knowledge base"
																: "System error"}
														</div>
													) : (
														<div className="text-white text-xs flex flex-row gap-2 items-center bg-[#2b5a1aa7] px-3 py-1 rounded-full w-fit">
															<SearchCheckIcon size={16} />
															Retrieved Information
														</div>
													)}
												</div>
											)}
										</div>
									);
								}

								if (state === "call" || isLoading) {
									const { args } = toolInvocation;

									return (
										<div
											key={toolCallId}
											className={cx({
												skeleton: ["fa_noggrann_information"].includes(
													toolName,
												),
											})}
										>
											{toolName === "fa_noggrann_information" && (
												<div className="flex flex-col gap-3 items-start my-2 border border-muted/50 bg-muted/20 rounded-2xl p-4">
													<p className="text-xs  italic text-muted-foreground/60">
														{args?.short_summary}
													</p>
													<div className="text-white text-xs flex flex-row gap-2 items-center bg-[#2b5a1aa7] px-3 py-1 rounded-full w-fit">
														<Loader2 className="animate-spin" size={16} />
														Accessing knowledge base...
													</div>
													<div className="flex flex-col gap-2">
														<div className="flex flex-row gap-2 items-center w-fit bg-muted px-3 py-1 rounded-xl">
															<Search size={16} className="shrink-0" />
															<p className="text-xs text-muted-foreground">
																{args?.question}
															</p>
														</div>
													</div>
												</div>
											)}
										</div>
									);
								}
							}
						})}

						<MessageActions
							key={`action-${message.id}`}
							chatId={chatId}
							message={message}
							vote={vote}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export const PreviewMessage = memo(
	PurePreviewMessage,
	(prevProps, nextProps) => {
		if (prevProps.isLoading !== nextProps.isLoading) return false;
		if (prevProps.message.id !== nextProps.message.id) return false;
		if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
		if (!equal(prevProps.vote, nextProps.vote)) return false;

		return true;
	},
);

// export const ThinkingMessage = () => {
// 	const role = "assistant";

// 	return (
// 		<motion.div
// 			data-testid="message-assistant-loading"
// 			className="w-full mx-auto max-w-3xl px-4 group/message "
// 			initial={{ opacity: 0 }}
// 			animate={{ opacity: 1, transition: { delay: 1 } }}
// 			data-role={role}
// 		>
// 			<div
// 				className={cn(
// 					"flex gap-4 group-data-[role=user]/message:px-3 w-full  items-center  group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
// 					{
// 						"group-data-[role=user]/message:bg-muted": true,
// 					},
// 				)}
// 			>
// 				<div className="size-8 flex items-center rounded-full justify-center shrink-0 bg-[#2B5A1A]">
// 					<Loader2 className="animate-spin" size={20} />
// 				</div>

// 				<div className="flex flex-col gap-4 text-muted-foreground animate-pulse duration-1000">
// 					Thinking...
// 				</div>
// 			</div>
// 		</motion.div>
// 	);
// };
export const ThinkingMessage = () => {
	return (
		<div className="w-full mx-auto max-w-3xl px-4 group/message flex flex-row items-center ">
			<div className="size-8 flex items-center rounded-full justify-center shrink-0 text-[#2B5A1A] overflow-hidden">
				<motion.div
					animate={{ scale: [1, 0.6, 1] }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<Dot size={80} />
				</motion.div>
			</div>

			<div className="flex flex-col gap-4 text-muted-foreground/60 text-xs">
				Thinking
			</div>
		</div>
	);
};
export const UsingToolMessage = () => {
	return (
		<div className="w-full mx-auto max-w-3xl px-4 group/message flex flex-row items-center ">
			<div className="size-8 flex items-center rounded-full justify-center shrink-0 text-[#2B5A1A] overflow-hidden">
				<motion.div
					animate={{ scale: [1, 0.6, 1] }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<Dot size={80} />
				</motion.div>
			</div>

			<div className="flex flex-col gap-4 text-muted-foreground/60 text-xs">
				Using tool
			</div>
		</div>
	);
};

export const WritingMessage = () => {
	return (
		<div className="w-full mx-auto max-w-3xl px-4 group/message flex flex-row items-center ">
			<div className="size-8 flex items-center rounded-full justify-center shrink-0 text-[#2B5A1A] overflow-hidden">
				<motion.div
					animate={{ scale: [1, 0.6, 1] }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<Dot size={80} />
				</motion.div>
			</div>
		</div>
	);
};

export const SearchingMessage = () => {
	const role = "assistant";

	return (
		<motion.div
			data-testid="message-assistant-loading"
			className="w-full mx-auto max-w-3xl px-4 group/message  animate-pulse duration-1000"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 1 } }}
			data-role={role}
		>
			<div
				className={cx(
					"flex gap-4 group-data-[role=user]/message:px-3 w-full items-center group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
					{
						"group-data-[role=user]/message:bg-muted": true,
					},
				)}
			>
				<div className="size-8 flex items-center rounded-full justify-center shrink-0 bg-[#2B5A1A]">
					<Brain size={20} className="text-white" />
				</div>

				<div className="flex flex-col gap-4 text-muted-foreground">
					Looking in my knowledge base...
				</div>
			</div>
		</motion.div>
	);
};
