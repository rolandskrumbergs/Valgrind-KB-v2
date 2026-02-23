import React from "react";
import { PlusIcon } from "lucide-react";
import { useChatSidebar } from "./chat-sidebar-context";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const ChatNewchatToggle = () => {
	const router = useRouter();
	const { isCollapsed } = useChatSidebar();

	if (isCollapsed) {
		return (
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
				<TooltipContent align="center" side="bottom">
					New Chat
				</TooltipContent>
			</Tooltip>
		);
	}

	return null;
};

export default ChatNewchatToggle;
