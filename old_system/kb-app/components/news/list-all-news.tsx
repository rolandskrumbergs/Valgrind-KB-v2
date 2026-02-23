import React from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { useNewsQuery } from "@/features/news/useNewsQuery";
import NewsItem from "./news-list-item";
import type { NewsItemInList } from "@/features/news/types";

const ListAllNews = () => {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useNewsQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-4">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while loading news";
    return (
      <View className="mt-2 rounded-lg bg-red-900/30 p-4">
        <Text className="text-white">Error loading news: {errorMessage}</Text>
      </View>
    );
  }

  if (data?.length === 0) {
    return (
      <View className="py-4">
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
      className="mt-2 px-2"
      scrollEnabled={true}
      onRefresh={refetch}
      refreshing={isRefetching}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ListAllNews;
