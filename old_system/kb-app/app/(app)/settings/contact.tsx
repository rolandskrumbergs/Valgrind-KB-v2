import React from "react";
import { View, Text, Pressable, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const Contacts = () => {
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL("mailto:dataskydd@intressebevakaren.se").catch(() =>
      Alert.alert(t("contact.errorTitle"), t("contact.errorMessage"))
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.push("/(app)/profile")}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">
          {t("contact.title")}
        </Text>
      </View>

      <View className="relative flex-1 bg-nav-bg px-4 pt-5">
        <Text className="mb-6 text-base leading-relaxed text-white">
          {t("contact.description")}
        </Text>

        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-white">
            {t("contact.emailLabel")}
          </Text>
          <Pressable onPress={handleEmailPress}>
            <Text className="text-base text-primary">
              support@intressebevakaren.se
            </Text>
          </Pressable>
        </View>

        <View className="mb-6">
          <Text className="text-base leading-relaxed text-white">
            Intressebevakaren AB{"\n"}
            Box 10013{"\n"}
            720 10 Västerås{"\n"}
            Sverige
          </Text>
        </View>

        <Text className="text-sm italic text-nav-foreground">
          {t("contact.responseNote")}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Contacts;
