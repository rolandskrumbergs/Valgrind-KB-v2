import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth";
import { ScreenContainer, TextField } from "@/components/ui/exports";

const ResetPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: z.string().min(6, t("resetPassword.errors.passwordMinLength")),
      confirmPassword: z
        .string()
        .min(1, t("resetPassword.errors.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("resetPassword.errors.confirmPasswordMismatch"),
      path: ["confirmPassword"],
    });

const ResetPasswordScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(ResetPasswordSchema(t)),
  });

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setIsLoading(false);
    }, [reset])
  );

  const onSubmit = async ({
    password,
  }: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      Alert.alert(t("alerts.error"), t("resetPassword.errors.invalidToken"));
      return;
    }

    try {
      setIsLoading(true);

      await resetPassword(token, password);

      Alert.alert(t("alerts.success"), t("resetPassword.successMessage"), [
        {
          text: t("alerts.ok"),
          onPress: () => router.replace("/(auth)/sign-in"),
        },
      ]);
    } catch (err) {
      let errorMessage = t("resetPassword.errors.submitError");

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
          {/* Back to Login Link */}
          <View className="mb-8 w-full items-start">
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              className="flex-row items-center"
            >
              <Text className="text-md font-rajdhani text-primary">
                ← {t("resetPassword.backToLogin")}
              </Text>
            </Pressable>
          </View>

          {/* Title Section */}
          <View className="mb-8 w-full items-center">
            <Text className="mb-2 text-center font-rajdhani text-4xl font-semibold tracking-wide text-foreground">
              {t("resetPassword.title")}
            </Text>
            <Text className="text-center font-rajdhani text-base text-muted-foreground">
              {t("resetPassword.description")}
            </Text>
          </View>

          {/* Form Card */}
          <View className="w-full max-w-md rounded-2xl bg-card p-8">
            <View className="mb-6 flex flex-col gap-5">
              <TextField
                label={t("resetPassword.password")}
                name="password"
                control={control}
                error={errors.password}
                placeholder={t("resetPassword.placeholder.password")}
                secureTextEntry
              />

              <TextField
                label={t("resetPassword.confirmPassword")}
                name="confirmPassword"
                control={control}
                error={errors.confirmPassword}
                placeholder={t("resetPassword.placeholder.confirmPassword")}
                secureTextEntry
              />
            </View>

            {/* Submit Button */}
            <Pressable
              className="mb-6 rounded-lg bg-primary py-4"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || !token}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
                {isLoading
                  ? t("resetPassword.resetting")
                  : t("resetPassword.submit")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default ResetPasswordScreen;
