import React from "react";
import { View, Text, Pressable } from "react-native";
import { Check, AlertCircle } from "lucide-react-native";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
  error,
}) => {
  return (
    <View>
      <Pressable
        className="flex-row items-start gap-3"
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          className={`h-6 w-6 items-center justify-center rounded border-2 ${
            checked ? "border-primary bg-primary" : "border-foreground/40"
          }`}
        >
          {checked && <Check size={18} color="white" strokeWidth={3} />}
        </View>
        <Text className="flex-1 font-rajdhani text-sm leading-5 text-foreground">
          {label}
        </Text>
      </Pressable>
      {error && (
        <View className="mt-2 flex-row items-center gap-2 px-2 py-2">
          <AlertCircle size={16} color="#E85D5D" />
          <Text className="flex-1 font-rajdhani text-sm text-destructive">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};
