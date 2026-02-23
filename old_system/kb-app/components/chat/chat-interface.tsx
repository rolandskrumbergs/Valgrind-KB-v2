import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import {
  View,
  Text,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { ArrowLeft, AlertTriangle, Info, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useChat } from "@ai-sdk/react";
import Messages from "./messages";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { fetch as expoFetch } from "expo/fetch";
import { ChatInput } from "@/components/ui/exports";
import type { ChatInterfaceProps } from "@/features/chats/types";
import { checkTokenAvailability } from "@/features/chats/use-chats-query";
import { useCoursePurchase } from "@/features/education/use-course-purchase";
import { useFirstTimeAlerts } from "@/hooks/use-first-time-alerts";

const ChatInterface = ({ id, initialMessages, userId }: ChatInterfaceProps) => {
  const [isUsingTool, setIsUsingTool] = useState(false);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const { t } = useTranslation();
  const { isPurchasing, purchase } = useCoursePurchase("75", "token");
  const {
    shouldShowWarning,
    shouldShowInfo,
    markWarningShown,
    markInfoShown,
    isLoading: isLoadingAlerts,
  } = useFirstTimeAlerts(userId);

  const insets = useSafeAreaInsets();

  const { messages, input, setInput, append, status } = useChat({
    id,
    headers: {
      "User-ID": userId,
    },
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: "https://kb.intressebevakaren.se/api/chat",
    body: { id },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: () => uuidv4(),

    onToolCall: ({ toolCall }) => {
      console.log(
        "🔧 Tool called:",
        toolCall.toolName,
        "- Setting isUsingTool = true"
      );
      setIsUsingTool(true);
    },
    onFinish: (message) => {
      console.log(
        "✅ Message finished:",
        message.content?.substring(0, 50),
        "- Setting isUsingTool = false"
      );
      setIsUsingTool(false);
    },
    onError: (error) => {
      console.error("❌ Chat error:", error);
      if (error?.message?.includes("TOKEN_QUOTA_EXCEEDED")) {
        Alert.alert(t("chat.limit_title"), t("chat.limit_message"), [
          { text: t("chat.limit_ok") },
        ]);
      }
      setIsUsingTool(false);
    },
  });

  // Custom submit handler to check token availability before sending
  const handleCustomSubmit = async (text: string) => {
    if (isCheckingTokens || isPurchasing) {
      return; // Prevent multiple simultaneous checks
    }

    setIsCheckingTokens(true);

    try {
      // Make a fresh API call to check token availability
      const tokenAvailability = await checkTokenAvailability(userId);

      if (!tokenAvailability.tokensAvailable) {
        Alert.alert(t("chat.no_tokens_title"), t("chat.no_tokens_message"), [
          {
            text: t("chat.buy_tokens"),
            onPress: () => {
              void (async () => {
                const purchased = await purchase();
                if (purchased) {
                  // Clear input immediately before sending
                  setInput("");
                  // Retry sending the message after successful purchase
                  await append({
                    id: uuidv4(),
                    role: "user",
                    content: text,
                  });
                }
              })();
            },
          },
          {
            text: t("chat.cancel"),
            style: "cancel",
          },
        ]);
        return;
      }

      // Proceed with normal submit if tokens are available
      // Clear input immediately before sending
      setInput("");
      // Use append instead of handleSubmit for better control
      await append({
        id: uuidv4(),
        role: "user",
        content: text,
      });
    } catch (error) {
      console.error("Token check error:", error);
      Alert.alert(t("chat.error_title"), t("chat.error_checking_tokens"), [
        { text: t("chat.ok") },
      ]);
    } finally {
      setIsCheckingTokens(false);
    }
  };

  const handleWarningPress = useCallback(() => {
    Alert.alert(t("chat.warning_title"), t("chat.warning"), [
      { text: t("chat.ok") },
    ]);
  }, [t]);

  const handleInfoPress = useCallback(() => {
    Alert.alert(t("chat.info_title"), t("overview.intro"), [
      { text: t("chat.ok") },
    ]);
  }, [t]);

  const handleNewChat = useCallback(() => {
    const newChatId = uuidv4();
    router.push(`/(app)/lena-chat/${newChatId}?new=true`);
  }, []);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Show first-time alerts automatically
  useEffect(() => {
    if (isLoadingAlerts) return;

    // Show info alert first, then warning
    if (shouldShowInfo) {
      Alert.alert(t("chat.info_title"), t("overview.intro"), [
        {
          text: t("chat.ok"),
          onPress: () => {
            void markInfoShown();
            // After info, show warning if needed
            if (shouldShowWarning) {
              Alert.alert(t("chat.warning_title"), t("chat.warning"), [
                {
                  text: t("chat.ok"),
                  onPress: () => void markWarningShown(),
                },
              ]);
            }
          },
        },
      ]);
    } else if (shouldShowWarning) {
      Alert.alert(t("chat.warning_title"), t("chat.warning"), [
        {
          text: t("chat.ok"),
          onPress: () => void markWarningShown(),
        },
      ]);
    }
  }, [
    shouldShowInfo,
    shouldShowWarning,
    isLoadingAlerts,
    t,
    markInfoShown,
    markWarningShown,
  ]);

  return (
    // <KeyboardAvoidingView
    //   className="bg-background"
    //   style={{ flex: 1 }}
    //   behavior={Platform.OS === "ios" ? "padding" : "height"}
    //   keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 165}
    // >
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="h-fit flex-row items-center justify-between gap-2 bg-background px-4 py-4">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.push("/(app)")}>
            <ArrowLeft size={24} color="#FAF3ED" />
          </Pressable>
          <Text className="pl-2 text-2xl font-bold text-white">
            {t("chat.title")}
          </Text>
        </View>
        <View className="flex-row items-center gap-5">
          <Pressable onPress={handleInfoPress}>
            <Info size={24} color="#5593AC" />
          </Pressable>
          <Pressable onPress={handleWarningPress}>
            <AlertTriangle size={24} color="#FAF3ED" />
          </Pressable>
          <Pressable onPress={handleNewChat}>
            <Plus size={24} color="#FAF3ED" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({
          ios: 100,
          android: isKeyboardVisible ? insets.bottom + 165 : 0,
        })}
      >
        <View style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
          <Messages
            status={status}
            messages={messages}
            isUsingTool={isUsingTool}
            append={append}
          />
        </View>

        <ChatInput
          onSubmit={handleCustomSubmit}
          placeholder={t("chat.placeholder")}
          disabled={status === "streaming" || isCheckingTokens || isPurchasing}
          value={input}
          onChangeText={setInput}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
    // </KeyboardAvoidingView>
  );
};

export default ChatInterface;
