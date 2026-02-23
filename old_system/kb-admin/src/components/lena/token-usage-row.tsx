"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { TokenUsage } from "@/db/schema";

interface TokenUsageRowProps {
	tokenUsage: TokenUsage;
}

export default function TokenUsageRow({ tokenUsage }: TokenUsageRowProps) {
	return (
		<TableRow className="hover:bg-muted-foreground/20">
			<TableCell>{tokenUsage.chatId}</TableCell>
			<TableCell>{tokenUsage.userId}</TableCell>
			<TableCell>{tokenUsage.messageId}</TableCell>
			<TableCell>
				{new Date(tokenUsage.createdAt).toLocaleDateString()}
			</TableCell>
			<TableCell>{tokenUsage.promptTokens}</TableCell>
			<TableCell>{tokenUsage.completionTokens}</TableCell>
		</TableRow>
	);
}
