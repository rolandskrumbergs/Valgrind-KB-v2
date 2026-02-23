import { memo } from "react";
import { ChatSidebarToggle } from "@/components/chat/chat-sidebar-toggle";
import ChatNewchatToggle from "./chat-newchat-toggle";
import ChatProfileSelector from "./chat-profile-selector";
import type { LenaProfile } from "@/db/queries/lena-queries";

function PureChatHeader({
	setSelectedProfileID,
	lenaProfile,
}: {
	setSelectedProfileID: (profileID: string | undefined) => void;
	lenaProfile: LenaProfile | undefined;
}) {
	return (
		<header className="flex relative bg-muted h-12 rounded-lg items-center px-2 gap-3">
			<ChatSidebarToggle />
			<ChatNewchatToggle />
			<ChatProfileSelector
				setSelectedProfileID={setSelectedProfileID}
				lenaProfile={lenaProfile}
			/>

			<div className="flex-1 flex items-center justify-center absolute left-1/2 -translate-x-1/2">
				Chat with Lena AI
			</div>
		</header>
	);
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
	return prevProps.lenaProfile === nextProps.lenaProfile;
});
