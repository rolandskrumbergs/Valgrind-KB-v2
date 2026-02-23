import React from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  loading = false,
  className = "",
}) => {
  return (
    <View className="flex-1 relative">
      <SafeAreaView className={`flex-1 bg-ocean ${className}`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {loading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default ScreenContainer;
