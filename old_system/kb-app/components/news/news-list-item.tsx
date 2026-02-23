import { View, Pressable, Text, ImageBackground } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import type { NewsItemInList } from "@/features/news/types";

interface NewsItemProps {
  item: NewsItemInList;
}

const NewsItem = ({ item }: NewsItemProps) => {
  const { t } = useTranslation();

  // Use subtitle from API if available, otherwise use a fallback based on title
  const getSubtitle = () => {
    if (item.subtitle) {
      return item.subtitle;
    }
    // Fallback: use a generic subtitle or could be left empty
    return t("news.newArticle");
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={() => router.push(`/(app)/news/${item.id}`)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          className="h-32 overflow-hidden rounded-lg bg-muted"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View
            className="flex h-full flex-row items-stretch"
            pointerEvents="none"
          >
            {/* Image Section - 33% width */}
            <ImageBackground
              source={{
                uri:
                  item.featuredImage ||
                  "https://via.placeholder.com/300x300?text=News",
              }}
              className="h-full w-[33%]"
              resizeMode="cover"
            />

            {/* Content Section - 67% width */}
            <View className="flex-1 justify-center px-4 py-4">
              <Text
                className="mb-2 text-lg font-bold uppercase tracking-wide text-white"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <Text
                className="text-sm leading-relaxed text-muted-foreground"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {getSubtitle()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default NewsItem;
