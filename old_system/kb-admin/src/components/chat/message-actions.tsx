import type { Message } from "ai";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/db/schema";
import { Button } from "../ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import { memo } from "react";
import equal from "fast-deep-equal";
import { toast } from "sonner";
import { CopyIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function PureMessageActions({
	chatId,
	message,
	vote,
	isLoading,
}: {
	chatId: string;
	message: Message;
	vote: Vote | undefined;
	isLoading: boolean;
}) {
	const { mutate } = useSWRConfig();
	const [, copyToClipboard] = useCopyToClipboard();

	if (isLoading) return null;
	if (message.role === "user") return null;

	return (
		<TooltipProvider delayDuration={0}>
			<div className="flex flex-row mt-2 border border-muted/50 rounded-xl p-2 gap-3 bg-muted/20 items-center  w-fit">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							className=" h-fit text-muted-foreground cursor-pointer group"
							onClick={async () => {
								const textFromParts = message.parts
									?.filter((part) => part.type === "text")
									.map((part) => part.text)
									.join("\n")
									.trim();

								if (!textFromParts) {
									toast.error("There's no text to copy!");
									return;
								}

								await copyToClipboard(textFromParts);
								toast.success("Copied to clipboard!");
							}}
						>
							<CopyIcon
								size={16}
								className="text-muted-foreground/50 group-hover:text-muted-foreground"
							/>
						</button>
					</TooltipTrigger>
					<TooltipContent>Copy</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							data-testid="message-upvote"
							className=" h-fit text-muted-foreground cursor-pointer"
							disabled={vote?.isUpvoted}
							onClick={async () => {
								const upvote = fetch("/api/vote", {
									method: "PATCH",
									body: JSON.stringify({
										chatId,
										messageId: message.id,
										type: "up",
									}),
								});

								toast.promise(upvote, {
									loading: "Upvoting Response...",
									success: () => {
										mutate<Array<Vote>>(
											`/api/vote?chatId=${chatId}`,
											(currentVotes) => {
												if (!currentVotes) return [];

												const votesWithoutCurrent = currentVotes.filter(
													(vote) => vote.messageId !== message.id,
												);

												return [
													...votesWithoutCurrent,
													{
														chatId,
														messageId: message.id,
														isUpvoted: true,
													},
												];
											},
											{ revalidate: false },
										);

										return "Upvoted Response!";
									},
									error: "Failed to upvote response.",
								});
							}}
						>
							<ThumbsUp
								size={16}
								className={cn({
									"text-muted-foreground/50": !vote?.isUpvoted,
								})}
							/>
						</button>
					</TooltipTrigger>
					<TooltipContent>Upvote Response</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							data-testid="message-downvote"
							className=" h-fit text-muted-foreground cursor-pointer"
							disabled={vote && !vote.isUpvoted}
							onClick={async () => {
								const downvote = fetch("/api/vote", {
									method: "PATCH",
									body: JSON.stringify({
										chatId,
										messageId: message.id,
										type: "down",
									}),
								});

								toast.promise(downvote, {
									loading: "Downvoting Response...",
									success: () => {
										mutate<Array<Vote>>(
											`/api/vote?chatId=${chatId}`,
											(currentVotes) => {
												if (!currentVotes) return [];

												const votesWithoutCurrent = currentVotes.filter(
													(vote) => vote.messageId !== message.id,
												);

												return [
													...votesWithoutCurrent,
													{
														chatId,
														messageId: message.id,
														isUpvoted: false,
													},
												];
											},
											{ revalidate: false },
										);

										return "Downvoted Response!";
									},
									error: "Failed to downvote response.",
								});
							}}
						>
							<ThumbsDown
								size={16}
								className={cn({
									"text-muted-foreground":
										vote !== undefined && !vote.isUpvoted,
									"text-muted-foreground/50":
										vote === undefined || vote.isUpvoted,
								})}
							/>
						</button>
					</TooltipTrigger>
					<TooltipContent>Downvote Response</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

export const MessageActions = memo(
	PureMessageActions,
	(prevProps, nextProps) => {
		if (!equal(prevProps.vote, nextProps.vote)) return false;
		if (prevProps.isLoading !== nextProps.isLoading) return false;

		return true;
	},
);
