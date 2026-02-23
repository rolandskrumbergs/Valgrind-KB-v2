import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import PaginationControls from "../customers/pagination-controls";
import type { TokenUsage, Chat, Message, User } from "@/db/schema";
import { getTokenUsageAction } from "@/actions/chat-actions";

const limit = 18;

// Define Part type locally based on usage
type Part = {
	type: "text";
	text: string;
	// Add other possible part types if needed
};

// Helper to extract text content from message parts
const getMessageText = (parts: unknown): string => {
	if (Array.isArray(parts)) {
		return parts
			.filter((part): part is Part => part && part.type === "text")
			.map((part) => part.text)
			.join(" ");
	}
	return "Invalid format";
};

type TokenUsageWithRelations = TokenUsage & {
	chat: Pick<Chat, "title"> | null;
	message: Pick<Message, "parts"> | null;
	user: Pick<User, "name"> | null;
};

const TokenUsageTable = async ({ page }: { page: number }) => {
	const offset = (page - 1) * limit;
	// Type assertion needed here as the action now returns the enriched type
	const result = (await getTokenUsageAction(limit, offset)) as Awaited<
		ReturnType<typeof getTokenUsageAction>
	> & {
		data?: TokenUsageWithRelations[];
	};

	if ("error" in result) {
		return (
			<div className="h-fit w-full bg-muted rounded-lg p-4">
				<div className="text-center text-destructive">{result.error}</div>
			</div>
		);
	}

	const tokenUsageData = result.data ?? [];
	const totalCount = result.totalCount ?? 0;
	const totalPages = Math.ceil(totalCount / limit);

	return (
		<div className="h-fit w-full bg-muted rounded-lg p-4">
			<div className="flex flex-col gap-4">
				<div>
					<h1 className="text-xl font-semibold">Token Usage</h1>
					<p className="text-sm text-muted-foreground">
						View token usage for all chats
					</p>
				</div>

				<div className="rounded-md border overflow-hidden">
					<Table>
						<TableHeader className="bg-muted-foreground/20">
							<TableRow>
								<TableHead className="text-muted-foreground">
									Message Content
								</TableHead>
								{/* <TableHead className="text-muted-foreground">
									Username
								</TableHead> */}
								<TableHead className="text-muted-foreground">
									Chat Title
								</TableHead>

								<TableHead className="text-muted-foreground">
									Created At
								</TableHead>
								<TableHead className="text-muted-foreground">
									Input Tokens
								</TableHead>
								<TableHead className="text-muted-foreground">
									Output Tokens
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="bg-muted-foreground/10">
							{tokenUsageData.length === 0 ? (
								<TableRow>
									<TableCell colSpan={9} className="text-center">
										No token usage records found
									</TableCell>
								</TableRow>
							) : (
								tokenUsageData.map((tokenUsage) => {
									// Get the full text safely using optional chaining
									const fullText = tokenUsage.message?.parts
										? getMessageText(tokenUsage.message.parts)
										: "Deleted Message";
									// Truncate if longer than 100 characters
									const truncatedText =
										fullText.length > 100
											? `${fullText.slice(0, 100)}...`
											: fullText;

									return (
										<TableRow
											key={tokenUsage.id}
											className="hover:bg-muted-foreground/20"
										>
											<TableCell className="max-w-xs truncate">
												{truncatedText}
											</TableCell>
											{/* <TableCell>{tokenUsage.user?.name ?? "N/A"}</TableCell> */}
											<TableCell>
												{tokenUsage.chat?.title ?? "Deleted Chat"}
											</TableCell>

											<TableCell>
												{new Date(tokenUsage.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>{tokenUsage.promptTokens}</TableCell>
											<TableCell>{tokenUsage.completionTokens}</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						Showing {offset + 1}-{Math.min(offset + limit, totalCount)} of{" "}
						{totalCount} records
					</div>
					<PaginationControls
						page={page}
						totalPages={totalPages}
						path="/analytics"
					/>
				</div>
			</div>
		</div>
	);
};

export default TokenUsageTable;
