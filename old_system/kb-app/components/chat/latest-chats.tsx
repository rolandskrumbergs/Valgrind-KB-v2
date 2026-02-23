import React from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { useChatsQuery } from "@/features/chats/use-chats-query";
import ChatItem from "./chat-list-item";

const LatestChats = () => {
  const { data: chats, isLoading, error, refetch } = useChatsQuery(3);

  // Minimum height for 3 chat items to prevent layout shift
  const MIN_HEIGHT = 195; // Approximately 3 items * (60px height + 12px margin)

  if (isLoading) {
    return (
      <View
        className="items-center justify-center py-4"
        style={{ minHeight: MIN_HEIGHT }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while loading chats";
    return (
      <View
        className="mt-2 rounded-lg bg-red-900/30 p-4"
        style={{ minHeight: MIN_HEIGHT }}
      >
        <Text className="text-white">Error loading chats: {errorMessage}</Text>
      </View>
    );
  }

  if (chats?.length === 0) {
    return (
      <View className="py-4" style={{ minHeight: MIN_HEIGHT }}>
        <Text className="text-center text-white">No chats available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      renderItem={(data) => <ChatItem item={data.item} />}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
};

export default LatestChats;
