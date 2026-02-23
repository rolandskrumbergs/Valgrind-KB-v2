import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCoursePurchase } from "@/features/education/use-course-purchase";
import { useTranslation } from "react-i18next";
import { checkTokenAvailability } from "@/features/chats/use-chats-query";
import { useAuth } from "@/features/auth";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { isPurchasing, purchase } = useCoursePurchase("75", "token");
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);

  const handlePurchase = async () => {
    if (isCheckingTokens || isPurchasing) {
      return; // Prevent multiple simultaneous checks
    }

    setIsCheckingTokens(true);

    try {
      // Make a fresh API call to check token availability
      const tokenAvailability = await checkTokenAvailability(userId);

      if (tokenAvailability.tokensAvailable) {
        Alert.alert(
          t("profile.extraChat.hasTokensTitle"),
          t("profile.extraChat.hasTokensMessage"),
          [{ text: t("profile.ok") }]
        );
        return;
      }

      // If no tokens, proceed with purchase
      await purchase();
    } catch (error) {
      console.error("Error checking token availability:", error);
      Alert.alert(t("chat.error_title"), t("chat.error_checking_tokens"), [
        { text: t("chat.ok") },
      ]);
    } finally {
      setIsCheckingTokens(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.push("/(app)/profile")}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">
          {t("profile.extraChat.title")}
        </Text>
      </View>

      <ScrollView className="relative flex-1 bg-nav-bg px-4 pt-5">
        <Text className="mb-3 text-base text-white">
          {t("profile.extraChat.description")}
        </Text>
        <Text className="mb-4 text-base text-white">
          {t("profile.extraChat.details")}
        </Text>
        <Text className="mb-2 text-base font-semibold text-white">
          {t("profile.extraChat.benefits")}
        </Text>
        <View className="mb-4 ml-4">
          <Text className="mb-1 text-base text-white">
            • {t("profile.extraChat.benefit1")}
          </Text>
        </View>
        <View className="mb-4">
          <Text className="text-base font-semibold text-white">
            {t("profile.extraChat.price")}
          </Text>
          <Text className="text-base text-white">
            {t("profile.extraChat.access")}
          </Text>
        </View>
        <Text className="mb-4 text-base text-white">
          {t("profile.extraChat.explanation")}
        </Text>

        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || isCheckingTokens}
          className="mb-6 rounded-lg bg-primary py-4"
        >
          <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
            {isPurchasing || isCheckingTokens
              ? t("signin.loading")
              : t("profile.extraChat.buyButton")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
