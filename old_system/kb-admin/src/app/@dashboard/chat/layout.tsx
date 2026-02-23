import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatSidebarProvider } from "@/components/chat/chat-sidebar-context";

export default async function ChatPage({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ChatSidebarProvider>
			<div className="flex h-full transition-all duration-200 ease-in-out">
				<ChatSidebar />
				<div className="flex-1 overflow-hidden transition-all duration-200 ease-in-out">
					{children}
				</div>
			</div>
		</ChatSidebarProvider>
	);
}
