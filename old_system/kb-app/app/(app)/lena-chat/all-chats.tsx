import { View, Text, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ListAllChats from "@/components/chat/list-all-chats";
import { useTranslation } from "react-i18next";

const AllChatsPage = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-ocean-dark">
      <View className="h-fit flex-row items-center justify-start gap-2 border-b border-black-100/20 bg-ocean-dark px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-linen">
          {t("general.allChats")}
        </Text>
        <LinearGradient
          colors={["#000", "transparent"]}
          style={{
            position: "absolute",
            bottom: -20,
            left: 0,
            right: 0,
            height: 20,
            zIndex: 100,
          }}
        />
      </View>
      <View className="flex-1">
        <ListAllChats />
      </View>
    </SafeAreaView>
  );
};

export default AllChatsPage;
