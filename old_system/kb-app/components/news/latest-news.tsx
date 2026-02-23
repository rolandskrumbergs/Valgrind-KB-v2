import React from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import NewsItem from "./news-list-item";
import { useNewsQuery } from "@/features/news/useNewsQuery";
import type { NewsItemInList } from "@/features/news/types";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

const LatestNews = () => {
  const { data, isLoading, error, refetch, isRefetching } = useNewsQuery(3);

  useRefreshOnFocus(refetch);

  // Minimum height for 3 news items to prevent layout shift
  const MIN_HEIGHT = 408; // 3 items * (128px height + 12px margin)

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
        : "An error occurred while loading news";
    return (
      <View
        className="mt-2 rounded-lg bg-red-900/30 p-4"
        style={{ minHeight: MIN_HEIGHT }}
      >
        <Text className="text-white">Error loading news: {errorMessage}</Text>
      </View>
    );
  }

  if (data?.length === 0) {
    return (
      <View className="py-4" style={{ minHeight: MIN_HEIGHT }}>
        <Text className="text-center text-white">No news available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item }: { item: NewsItemInList }) => (
        <NewsItem item={item} />
      )}
      keyExtractor={(item: NewsItemInList) => item.id}
      scrollEnabled={false}
      onRefresh={refetch}
      refreshing={isRefetching}
    />
  );
};

export default LatestNews;
