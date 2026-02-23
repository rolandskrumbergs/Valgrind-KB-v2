import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const rights = t("privacy.rights.list", { returnObjects: true }) as string[];

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.push("/(app)/profile")}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">
          {t("privacy.title")}
        </Text>
      </View>

      <ScrollView className="relative flex-1 bg-nav-bg px-4 pt-5">
        <Text className="mb-2 text-base font-semibold text-white">
          {t("privacy.sharing.title")}
        </Text>
        <Text className="mb-6 text-base leading-relaxed text-white">
          {t("privacy.sharing.description")}
        </Text>

        <Text className="mb-2 text-base font-semibold text-white">
          {t("privacy.rights.title")}
        </Text>
        <Text className="mb-4 text-base leading-relaxed text-white">
          {t("privacy.rights.description")}
        </Text>

        {rights.map((right) => (
          <Text
            key={`right-${right}`}
            className="mb-2 text-base leading-relaxed text-white"
          >
            • {right}
          </Text>
        ))}

        <Text className="mb-2 mt-6 text-base font-semibold text-white">
          {t("privacy.rights.title2")}
        </Text>
        {(t("privacy.rights.list2", { returnObjects: true }) as string[]).map(
          (item: string) => (
            <Text
              key={`right2-${item}`}
              className="mb-2 text-base leading-relaxed text-white"
            >
              • {item}
            </Text>
          )
        )}

        <Text className="mb-2 mt-6 text-base font-semibold text-white">
          {t("privacy.storage.title")}
        </Text>
        <Text className="mb-4 text-base leading-relaxed text-white">
          {(
            t("privacy.storage.points", { returnObjects: true }) as string[]
          ).map((line: string) => (
            <Text key={`storage-${line}`}>
              • {line}
              {"\n"}
            </Text>
          ))}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
