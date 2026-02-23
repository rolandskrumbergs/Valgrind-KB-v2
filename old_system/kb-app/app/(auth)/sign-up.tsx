import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/features/auth";
import {
  ScreenContainer,
  TextField,
  Checkbox,
} from "@/components/ui/exports";

const SignUpSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(1, t("signup.errors.nameRequired")),
      lastName: z.string().min(1, t("signup.errors.lastNameRequired")),
      email: z
        .string()
        .min(1, t("signup.errors.emailRequired"))
        .email(t("signup.errors.emailInvalid")),
      password: z.string().min(6, t("signup.errors.passwordMinLength")),
      confirmPassword: z
        .string()
        .min(1, t("signup.errors.confirmPasswordRequired")),
      gdprConsent: z
        .boolean()
        .refine((val) => val === true, t("signup.errors.gdprConsentRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("signup.errors.confirmPasswordMismatch"),
      path: ["confirmPassword"],
    });

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      gdprConsent: false,
    },
    resolver: zodResolver(SignUpSchema(t)),
  });

  const gdprConsent = watch("gdprConsent") || false;

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setIsLoading(false);
    }, [reset])
  );

  const onSubmit = async (data: {
    email: string;
    password: string;
    name: string;
    lastName: string;
    gdprConsent?: boolean;
  }) => {
    try {
      setIsLoading(true);

      await signUp(data.email, data.password, data.name, data.lastName);

      router.replace("/(app)");
    } catch (err) {
      let errorMessage = t("signup.errors.signupFailed");
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
              {t("signup.title")}
            </Text>
            <Text className="text-center font-rajdhani text-base text-muted-foreground">
              {t("signup.subtitle")}
            </Text>
          </View>

          {/* Form Card */}
          <View className="w-full max-w-md rounded-2xl bg-card p-8">
            <View className="mb-6 flex flex-col gap-5">
              <TextField
                label={t("signup.name")}
                name="name"
                control={control}
                error={errors.name}
                placeholder={t("signup.placeholder.name")}
              />

              <TextField
                label={t("signup.lastName")}
                name="lastName"
                control={control}
                error={errors.lastName}
                placeholder={t("signup.placeholder.lastName")}
              />

              <TextField
                label={t("signup.email")}
                name="email"
                control={control}
                error={errors.email}
                placeholder={t("signup.placeholder.email")}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextField
                label={t("signup.password")}
                name="password"
                control={control}
                error={errors.password}
                placeholder={t("signup.placeholder.password")}
                secureTextEntry
              />

              <TextField
                label={t("signup.confirmPassword")}
                name="confirmPassword"
                control={control}
                error={errors.confirmPassword}
                placeholder={t("signup.placeholder.confirmPassword")}
                secureTextEntry
              />

              {/* GDPR Consent Checkbox */}
              <View>
                <Checkbox
                  checked={gdprConsent}
                  onToggle={() => setValue("gdprConsent", !gdprConsent)}
                  label={t("signup.gdprConsent")}
                  error={errors.gdprConsent?.message}
                />
                <Pressable
                  onPress={() => router.push("/privacy-policy")}
                  className="ml-9 mt-2"
                >
                  <Text className="font-rajdhani text-sm text-primary underline">
                    {t("signup.readPrivacyPolicy")}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              className="mb-4 rounded-lg bg-primary py-4"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
                {isLoading ? t("signup.loading") : t("signup.submit")}
              </Text>
            </Pressable>

            {/* Back to Start Button */}
            <Pressable
              className="mb-6 rounded-lg border border-primary py-4"
              onPress={() => router.push("/(auth)")}
              disabled={isLoading}
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary">
                {t("signup.backToStart")}
              </Text>
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-md font-rajdhani text-muted-foreground">
                {t("signup.alreadyAccount")}{" "}
              </Text>
              <Pressable onPress={() => router.push("/sign-in")}>
                <Text className="text-md font-rajdhani font-medium text-primary">
                  {t("signup.login")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
