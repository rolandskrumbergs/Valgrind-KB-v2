import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { generateUUID } from "@/utils/generate-uuid";
import ChatInterface from "@/components/chat/chat-interface";
import { useAuth } from "@/features/auth";
import { useTranslation } from "react-i18next";

const LenaChatTab = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  // Generate ID only once on mount to prevent re-initialization
  const id = useMemo(() => generateUUID(), []);

  // Show no-license message if user doesn't have a license
  if (!session?.user?.hasLicense) {
    return (
      <View className="flex-1 items-center justify-center bg-nav-bg px-6">
        <Text className="text-center text-lg leading-7 text-white">
          {t("chat.no_license_message")}
        </Text>
      </View>
    );
  }

  return (
    <ChatInterface id={id} initialMessages={[]} userId={session?.user?.id} />
  );
};

export default LenaChatTab;
