import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth";
import { ScreenContainer, TextField } from "@/components/ui/exports";

const SignInSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t("signin.errors.emailRequired"))
      .email(t("signin.errors.emailInvalid")),
    password: z.string().min(6, t("signin.errors.passwordMinLength")),
  });

const SignInScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();

  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(SignInSchema(t)),
  });

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setIsLoading(false);
    }, [reset])
  );

  const onSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      await signIn(email, password);
    } catch (err) {
      let errorMessage = t("signin.errors.signInFailed");

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
              {t("signin.title")}
            </Text>
            <Text className="text-center font-rajdhani text-base text-muted-foreground">
              {t("signin.subtitle")}
            </Text>
          </View>

          {/* Form Card */}
          <View className="w-full max-w-md rounded-2xl bg-card p-8">
            <View className="mb-6 flex flex-col gap-5">
              <TextField
                label={t("signin.email")}
                name="email"
                control={control}
                error={errors.email}
                placeholder="namn@exempel.se"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextField
                label={t("signin.password")}
                name="password"
                control={control}
                error={errors.password}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {/* Forgot Password Link */}
            <Pressable
              onPress={() => router.push("/forgot-password")}
              className="mb-6"
            >
              <Text className="text-md font-rajdhani text-primary">
                {t("signin.forgotPassword")}
              </Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              className="mb-4 rounded-lg bg-primary py-4"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
                {isLoading ? t("signin.loading") : t("signin.submit")}
              </Text>
            </Pressable>

            {/* Back to Start Button */}
            <Pressable
              className="mb-6 rounded-lg border border-primary py-4"
              onPress={() => router.push("/(auth)")}
              disabled={isLoading}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary">
                {t("signin.backToStart")}
              </Text>
            </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-md font-rajdhani text-muted-foreground">
                {t("signin.noAccount")}{" "}
              </Text>
              <Pressable onPress={() => router.push("/sign-up")}>
                <Text className="text-md font-rajdhani font-medium text-primary">
                  {t("signin.signUp")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default SignInScreen;
