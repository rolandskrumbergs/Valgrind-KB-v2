import { ChevronRight } from "lucide-react-native";
import { View, Pressable, Text } from "react-native";
import { router } from "expo-router";
import type { Chat } from "@/features/chats/types";
import { useTranslation } from "react-i18next";

const ChatItem = ({ item }: { item: Chat }) => {
  const { t } = useTranslation();

  // Format the date/time - use lastMessageAt if available, otherwise createdAt
  const timestamp = item.lastMessageAt || item.createdAt;
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    // If less than 24 hours, show relative time
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      if (diffInMinutes < 1) return t("general.justNow");
      return t("general.minutesAgo", { count: diffInMinutes });
    } else if (diffInHours < 24) {
      return t("general.hoursAgo", { count: diffInHours });
    } else if (diffInHours < 48) {
      return t("general.dayAgo");
    }

    // For older dates, show the actual date and time
    const days = Math.floor(diffInHours / 24);
    return t("general.daysAgo", { count: days });
  };

  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-lg bg-card"
      onPress={() => router.push(`/(app)/lena-chat/${item.id}`)}
    >
      <View className="flex-row items-center justify-between px-4 py-3.5">
        {/* Left side: Title and Subtitle */}
        <View className="w-[60%] gap-0.5">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>

        {/* Right side: Time and Chevron */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-400">
            {formatDateTime(timestamp)}
          </Text>
          <ChevronRight size={18} color="#9CA3AF" />
        </View>
      </View>
    </Pressable>
  );
};

export default ChatItem;
