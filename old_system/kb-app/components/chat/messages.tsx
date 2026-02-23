import { View, Text, ScrollView } from "react-native";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import React, { memo, useRef, useEffect, useState } from "react";
import type { Message } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { useTranslation } from "react-i18next";
import { Brain, Search } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import SuggestedActions from "./suggested-openers";

interface MessagesProps {
  status: UseChatHelpers["status"];
  messages: Array<Message>;
  isUsingTool: boolean;
  append: UseChatHelpers["append"];
}

const PureMessages = ({
  status,
  messages,
  isUsingTool,
  append,
}: MessagesProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const lastContentRef = useRef<string>("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isScrolledToBottomRef = useRef(true);

  // Reset auto-scroll when status changes to submitted
  useEffect(() => {
    if (status === "submitted") {
      setShouldAutoScroll(true);
      isScrolledToBottomRef.current = true;
    }
  }, [status]);

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  // Handle auto-scrolling for new messages and streaming
  useEffect(() => {
    const lastMessage = messages.at(-1);
    const currentLastContent = lastMessage?.content || "";

    if (
      scrollViewRef.current &&
      shouldAutoScroll &&
      isScrolledToBottomRef.current
    ) {
      if (
        messages.length > 0 &&
        (status === "streaming" ||
          lastContentRef.current.length < currentLastContent.length)
      ) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
    lastContentRef.current = currentLastContent;
  }, [messages, status, shouldAutoScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const currentIsAtBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    // Only update scroll behavior if the bottom status changes
    if (currentIsAtBottom !== isScrolledToBottomRef.current) {
      isScrolledToBottomRef.current = currentIsAtBottom;
      setShouldAutoScroll(currentIsAtBottom);
    }
  };

  const handleScrollBeginDrag = () => {
    if (status === "streaming") {
      setShouldAutoScroll(false);
    }
  };

  const getMessageText = (m: Message) => {
    if (m.content) return m.content;
    if (
      Array.isArray(m.parts) &&
      m.parts.length > 0 &&
      m.parts[0].type === "text"
    ) {
      return m.parts[0].text;
    }
    return "";
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      className="mb-2 flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      scrollEventThrottle={16}
      onContentSizeChange={() => {
        if (scrollViewRef.current && messages.length > 0 && shouldAutoScroll) {
          scrollViewRef.current.scrollToEnd({ animated: false });
        }
      }}
    >
      {messages.length === 0 && (
        <View className="mt-6 flex h-full flex-1 flex-col gap-6">
          <SuggestedActions append={append} />
        </View>
      )}
      {messages.map((m) => {
        return (
          <View key={m.id} className="my-2 w-full">
            <View
              className={`text-lg ${
                m.role === "user"
                  ? "border-white-100/10 bg-white-100/10  w-fit max-w-[80%] self-end rounded border-[0.3px] px-4 text-left text-white"
                  : "text-white-100 w-full text-left"
              }`}
            >
              <Markdown
                style={{
                  html: { color: "white", fontSize: 16, lineHeight: 26 },
                  text: { color: "white" },
                  bullet_list: { color: "white" },
                  bullet_list_icon: { color: "white" },
                  ordered_list: { color: "white" },
                  ordered_list_icon: { color: "white" },
                  list_item: { color: "white" },
                }}
              >
                {getMessageText(m)}
              </Markdown>
            </View>
          </View>
        );
      })}
      {messages.length > 0 &&
        messages.at(-1)?.role === "user" &&
        (status === "submitted" ||
          (status === "streaming" && !isUsingTool)) && <ThinkingUI />}
      {isUsingTool && <SearchingUI />}
    </ScrollView>
  );
};

const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});

const ThinkingUI = () => {
  const { t } = useTranslation();
  return (
    <View className="flex animate-pulse flex-row items-center gap-2">
      <View className="flex size-8 shrink-0 items-center justify-center rounded-full">
        <Brain size={20} color="#8899A6" />
      </View>
      <Text className="flex flex-col gap-4 text-lg font-medium text-[#8899A6]">
        {t("overview.thinking")}
      </Text>
    </View>
  );
};

const SearchingUI = () => {
  const { t } = useTranslation();
  return (
    <View className="flex animate-pulse flex-row items-center gap-2">
      <View className="flex size-8 shrink-0 items-center justify-center rounded-full">
        <Search size={20} color="#8899A6" />
      </View>
      <Text className="flex flex-col gap-4 text-lg font-medium text-[#8899A6]">
        {t("overview.searching")}
      </Text>
    </View>
  );
};

export default Messages;
