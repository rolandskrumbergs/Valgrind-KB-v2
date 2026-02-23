"use client";

import { Button } from "@/components/ui/button";
import { PanelLeftIcon } from "lucide-react";
import { useChatSidebar } from "./chat-sidebar-context";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatSidebarToggle() {
	const { toggleSidebar, isCollapsed } = useChatSidebar();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={toggleSidebar}
				>
					<PanelLeftIcon />
					<span className="sr-only">Toggle Chat Sidebar</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{isCollapsed ? "Show Chat History" : "Hide Chat History"}
			</TooltipContent>
		</Tooltip>
	);
}
