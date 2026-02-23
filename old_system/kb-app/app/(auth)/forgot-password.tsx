import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth";
import { ScreenContainer, TextField } from "@/components/ui/exports";

const ForgotPasswordSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t("forgotPassword.errors.emailRequired"))
      .email(t("forgotPassword.errors.emailInvalid")),
  });

const ForgotPasswordScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { requestPasswordReset } = useAuth();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(ForgotPasswordSchema(t)),
  });

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setIsLoading(false);
    }, [reset])
  );

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      setIsLoading(true);

      await requestPasswordReset(email);

      Alert.alert(t("alerts.success"), t("forgotPassword.successMessage"), [
        {
          text: t("alerts.ok"),
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      let errorMessage = t("forgotPassword.errors.submitError");

      if (typeof err === "string") {
        errorMessage = err;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      Alert.alert(t("alerts.error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer loading={isLoading}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <View className="mt-4 w-full flex-1 flex-col items-center justify-center px-6">
          {/* Title Section */}
          <View className="mb-8 w-full items-center">
            <Text className="mb-2 text-center font-rajdhani text-4xl font-semibold tracking-wide text-foreground">
              {t("forgotPassword.title")}
            </Text>
            <Text className="text-center font-rajdhani text-base text-muted-foreground">
              {t("forgotPassword.description")}
            </Text>
          </View>

          {/* Form Card */}
          <View className="w-full max-w-md rounded-2xl bg-card p-8">
            <View className="mb-6 flex flex-col gap-5">
              <TextField
                label={t("forgotPassword.email")}
                name="email"
                control={control}
                error={errors.email}
                placeholder="namn@exempel.se"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              className="mb-6 rounded-lg bg-primary py-4"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
                {isLoading
                  ? t("forgotPassword.sending")
                  : t("forgotPassword.submit")}
              </Text>
            </Pressable>

            {/* Back to Login Link */}
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center justify-center"
            >
              <ChevronLeft size={20} className="text-primary" color="#4A9B8E" />
              <Text className="text-md font-rajdhani font-medium text-primary">
                {t("forgotPassword.backToLogin")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default ForgotPasswordScreen;
