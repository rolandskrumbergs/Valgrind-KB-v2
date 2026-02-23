import { View, Text, ImageBackground } from "react-native";
import React from "react";
import ListAllNews from "@/components/news/list-all-news";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import images from "@/constants/images";
import { useNewsQuery } from "@/features/news/useNewsQuery";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

function AllNewsPage() {
  const { t } = useTranslation();
  const { refetch } = useNewsQuery();

  useRefreshOnFocus(refetch);

  return (
    <View className="flex-1 bg-page-bg">
      <ImageBackground
        source={images.coursesBg}
        className="w-full"
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(18, 18, 18, 0.4)", "#1e242b"]}
          locations={[0, 1]}
          className="pt-8"
        >
          <Text className="mb-6 px-4 text-2xl font-bold uppercase tracking-wide text-white">
            {t("news.allNews")}
          </Text>
        </LinearGradient>
      </ImageBackground>
      <View className="relative flex-1">
        <ListAllNews />
      </View>
    </View>
  );
}

export default AllNewsPage;
