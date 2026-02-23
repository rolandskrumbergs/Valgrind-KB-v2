import React from "react";
import { useLocalSearchParams } from "expo-router";
import ChatInterface from "@/components/chat/chat-interface";
import { View, ActivityIndicator } from "react-native";
import { useChatByIdQuery } from "@/features/chats/use-chats-query";
import { useAuth } from "@/features/auth";
import type { Message } from "ai";

const LenaChat = () => {
  const { id, new: isNewChat } = useLocalSearchParams();
  const { session } = useAuth();

  // Skip API query for new chats
  const shouldFetchChat = !isNewChat;
  const { data, isLoading, error } = useChatByIdQuery(
    id as string,
    shouldFetchChat
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#FAF3ED" />
      </View>
    );
  }

  // If there's an error or no data, treat it as a new chat
  if (error || !data) {
    return (
      <ChatInterface
        id={id as string}
        initialMessages={[]}
        userId={session?.user?.id}
      />
    );
  }

  // Convert string dates to Date objects for initialMessages
  const initialMessages: Message[] =
    data.messages?.map((message: any) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    })) || [];

  return (
    <ChatInterface
      id={data.chat?.id}
      initialMessages={initialMessages}
      userId={session?.user?.id}
    />
  );
};
export default LenaChat;
