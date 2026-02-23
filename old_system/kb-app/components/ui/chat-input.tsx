import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  Platform,
} from "react-native";
import { Send } from "lucide-react-native";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: number;
  minHeight?: number;
  value?: string;
  onChangeText?: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  maxHeight = 180,
  minHeight = 48,
  value,
  onChangeText,
}) => {
  const [internalText, setInternalText] = useState("");
  const [inputHeight, setInputHeight] = useState(minHeight);

  // Use external value and onChangeText if provided, otherwise use internal state
  const text = value === undefined ? internalText : value;
  const setText = onChangeText || setInternalText;

  const handleContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const height = e.nativeEvent.contentSize.height;
    if (height < maxHeight) {
      setInputHeight(Math.max(minHeight, height));
    } else {
      setInputHeight(maxHeight);
    }
  };

  const handlePress = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    // Only clear internal state if not using external value
    if (value === undefined) {
      setInternalText("");
    }
    setInputHeight(minHeight); // reset height
  };

  const isSubmitDisabled = !text.trim() || disabled;

  return (
    <View className="bg-[#1e242b] px-4 pb-3 pt-3">
      <View className="flex-row items-end gap-3 rounded-[12px] bg-page-bg">
        <TextInput
          className="flex-1 rounded bg-page-foreground px-4 text-base text-white"
          placeholder={placeholder}
          placeholderTextColor="#8899A6"
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="center"
          editable={!disabled}
          onContentSizeChange={handleContentSizeChange}
          enablesReturnKeyAutomatically
          style={{
            minHeight,
            maxHeight,
            height: inputHeight,
            paddingTop: Platform.OS === "ios" ? 12 : 10,
            paddingBottom: Platform.OS === "ios" ? 12 : 10,
          }}
        />

        <Pressable
          onPress={handlePress}
          disabled={isSubmitDisabled}
          className="h-14 w-14 items-center justify-center rounded-full bg-page-foreground"
        >
          <Send
            size={18}
            color={isSubmitDisabled ? "#8899A6" : "#FAFAFA"}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default ChatInput;
