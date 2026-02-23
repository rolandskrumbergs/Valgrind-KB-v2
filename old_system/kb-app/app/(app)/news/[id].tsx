import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, FileText } from "lucide-react-native";
import { useNewsByIdQuery } from "@/features/news/useNewsQuery";
import { RenderHTML } from "react-native-render-html";

import SmartImage from "@/components/ui/smart-image";
import { useTranslation } from "react-i18next";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

function NewsItem() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const {
    data: newsItem,
    isLoading,
    error,
    refetch,
  } = useNewsByIdQuery(id as string);

  useRefreshOnFocus(refetch);
  const { width } = useWindowDimensions();

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while loading news";
    return (
      <SafeAreaView className="flex-1 bg-nav-bg" edges={["top", "bottom"]}>
        <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FAF3ED" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">
            {t("news.news")}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-white">Error: {errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleOpenPdf = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error opening PDF:", err)
    );
  };

  // Add explicit check for news being null or undefined
  if (!newsItem) {
    return (
      <SafeAreaView className="flex-1 bg-nav-bg" edges={["top", "bottom"]}>
        <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FAF3ED" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">
            {t("news.news")}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-white">{t("news.noNews")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // HTML content style
  const htmlStyles = {
    body: {
      color: "white",
      fontSize: 16,
      lineHeight: 24,
    },
    p: {
      marginBottom: 0,
    },
    a: {
      color: "#3498db",
    },
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">{t("news.news")}</Text>
      </View>
      <View className="relative flex-1 bg-nav-bg">
        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-nav-bg">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : (
          <ScrollView className="flex-1 bg-nav-bg">
            <View className="relative w-full items-center">
              <SmartImage
                source={{ uri: newsItem.featuredImage }}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                }}
              />
              {/* Target Customer Badges */}
              <View className="absolute bottom-3 left-3 flex-row flex-wrap gap-2">
                {newsItem.targetCustomers &&
                newsItem.targetCustomers.length > 0 ? (
                  newsItem.targetCustomers.map((customer) => (
                    <View
                      key={customer.id}
                      className="rounded-full bg-nav-bg/90 px-3 py-1"
                    >
                      <Text className="text-xs font-semibold text-white">
                        {customer.name}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="rounded-full bg-nav-bg/90 px-3 py-1">
                    <Text className="text-xs font-semibold text-white">
                      {t("news.allUsers")}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="px-4 pb-40">
              <Text className="py-2 text-gray-400">
                {newsItem.createdAt ? formatDate(newsItem.createdAt) : ""}
              </Text>
              <Text className="mb-2 text-2xl font-bold text-white">
                {newsItem.title}
              </Text>

              <View className="mb-4 flex-row justify-between">
                {newsItem.userName && (
                  <Text className="text-gray-400">
                    {t("news.by")}: {newsItem.userName}
                  </Text>
                )}
              </View>

              {/* Render HTML content instead of plain text */}
              {newsItem.content && (
                <View className="mb-6">
                  <RenderHTML
                    contentWidth={width - 32} // Account for padding
                    source={{ html: newsItem.content }}
                    tagsStyles={htmlStyles}
                  />
                </View>
              )}

              {newsItem.pdfFiles && newsItem.pdfFiles.length > 0 && (
                <View className="mt-4">
                  <Text className="mb-2 text-lg font-semibold text-white">
                    {t("news.attachments")}:
                  </Text>
                  {newsItem.pdfFiles.map((pdf) => (
                    <Pressable
                      key={pdf.s3Key}
                      className="border-black-100/20 mb-2 w-full flex-row items-center justify-between gap-2 rounded border-[0.3px] bg-transparent px-4 py-3.5"
                      onPress={() => handleOpenPdf(pdf.s3Url)}
                    >
                      <View className="max-w-[85%]">
                        <Text className="text-base text-white">
                          {pdf.fileName}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {(pdf.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      </View>
                      <FileText size={20} color="#8899A6" />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

export default NewsItem;
