"use client";

import { useRouter } from "next/navigation";
import { SidebarHistory } from "@/components/chat/sidebar-history";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useChatSidebar } from "./chat-sidebar-context";

export function ChatSidebar() {
	const router = useRouter();
	const { isCollapsed } = useChatSidebar();

	return (
		<div
			className={cn(
				"bg-sidebar text-sidebar-foreground flex h-full flex-col border-r rounded-lg mr-2 transition-all duration-200 ease-in-out overflow-hidden",
				isCollapsed
					? "w-0 opacity-0 border-0 mr-0 invisible"
					: "w-[12rem] opacity-100 visible",
			)}
		>
			<div className="flex flex-col gap-2 p-2 min-w-[12rem] border-b h-12 justify-center">
				<div className="flex flex-row justify-between items-center">
					<Link href="/" className="flex flex-row gap-3 items-center">
						<span className="text-lg font-semibold  hover:bg-muted rounded-md cursor-pointer">
							Chat History
						</span>
					</Link>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="default"
								size="icon"
								type="button"
								onClick={() => {
									router.push("/chat");
									router.refresh();
								}}
							>
								<PlusIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent align="end">New Chat</TooltipContent>
					</Tooltip>
				</div>
			</div>
			<div className="flex min-h-0 flex-1 overflow-y-auto min-w-[12rem]">
				<SidebarHistory />
			</div>
		</div>
	);
}
