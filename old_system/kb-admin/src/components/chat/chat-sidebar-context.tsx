"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

interface ChatSidebarContextType {
	isCollapsed: boolean;
	toggleSidebar: () => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(
	undefined,
);

const STORAGE_KEY = "chat-sidebar-collapsed";

export function ChatSidebarProvider({ children }: { children: ReactNode }) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Initialize from localStorage on client side
	useEffect(() => {
		const storedValue = localStorage.getItem(STORAGE_KEY);
		if (storedValue !== null) {
			setIsCollapsed(storedValue === "true");
		}
	}, []);

	const toggleSidebar = () => {
		setIsCollapsed((prev) => {
			const newValue = !prev;
			// Save to localStorage
			localStorage.setItem(STORAGE_KEY, String(newValue));
			return newValue;
		});
	};

	return (
		<ChatSidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
			{children}
		</ChatSidebarContext.Provider>
	);
}

export function useChatSidebar() {
	const context = useContext(ChatSidebarContext);
	if (context === undefined) {
		throw new Error("useChatSidebar must be used within a ChatSidebarProvider");
	}
	return context;
}
