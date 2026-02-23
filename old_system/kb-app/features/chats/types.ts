import type { Message } from "ai";

export interface Chat {
  id: string;
  createdAt: string;
  title: string;
  subtitle?: string;
  lastMessageAt?: string;
}

// Extended chat data structure returned by API
export interface ChatData {
  chat: Chat;
  messages: any[]; // Will be converted to Message[] in components
}

// Message types based on the provided structure
export interface MessagePart {
  type: "text" | "tool-invocation";
  text?: string;
  toolInvocation?: ToolInvocation;
}

export interface ToolInvocation {
  state: "result";
  step: number;
  args: {
    question: string;
    short_summary: string;
  };
  toolCallId: string;
  toolName: string;
  result: {
    status: "error" | "success";
    type: "system-error" | "success";
    result: string;
  };
}

// Legacy ChatMessage type for backward compatibility
export interface ChatMessage {
  id: string;
  parts: MessagePart[];
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// Props for ChatInterface component
export interface ChatInterfaceProps {
  id: string;
  initialMessages: Message[];
  userId: string;
}

// Props for Messages component
export interface MessagesProps {
  chatId: string;
  status: "idle" | "streaming" | "error";
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  reload: () => void;
  isUsingTool: boolean;
  append: (message: Message) => void;
}

// Props for ChatInput component
export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
}
