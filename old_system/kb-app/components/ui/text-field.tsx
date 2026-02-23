import React from "react";
import { Text, View, TextInput, TextInputProps } from "react-native";
import { Control, Controller, FieldError } from "react-hook-form";
import { AlertCircle } from "lucide-react-native";

interface TextFieldProps extends Omit<TextInputProps, "onChangeText"> {
  label: string;
  name: string;
  control: Control<any>;
  error?: FieldError;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: TextInputProps["textAlignVertical"];
  style?: TextInputProps["style"];
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  control,
  error,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = "center",
  style,
  ...props
}) => {
  return (
    <View>
      <Text className="mb-2 font-rajdhani text-base font-semibold text-foreground">
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              className={`rounded-lg bg-input px-4 font-rajdhani text-base text-foreground ${
                error ? "border-2 border-destructive" : "border border-border"
              } ${multiline ? "min-h-[56px] py-4" : "h-14"}`}
              placeholder={placeholder}
              placeholderTextColor="#8899A6"
              value={value}
              onChangeText={onChange}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              multiline={multiline}
              numberOfLines={numberOfLines}
              textAlignVertical={textAlignVertical}
              style={style}
              {...props}
            />
            {error && (
              <View className="mt-2 flex-row items-center gap-2 px-2 py-2">
                <AlertCircle size={16} color="#E85D5D" />
                <Text className="flex-1 font-rajdhani text-sm text-destructive">
                  {error.message}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default TextField;
