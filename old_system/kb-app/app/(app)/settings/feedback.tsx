import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField, FormError } from "@/components/ui/exports";

const FeedbackSchema = (t: any) =>
  z.object({
    name: z.string().min(1, t("feedback.errors.nameRequired")),
    email: z
      .string()
      .min(1, t("feedback.errors.emailRequired"))
      .email(t("feedback.errors.emailInvalid")),
    subject: z.string().min(1, t("feedback.errors.subjectRequired")),
    message: z.string().min(10, t("feedback.errors.messageMinLength")),
  });

const Feedback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    resolver: zodResolver(FeedbackSchema(t)),
  });

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError("");

      Alert.alert(t("feedback.successTitle"), t("feedback.successMessage"), [
        {
          text: t("feedback.ok"),
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]);
    } catch (err) {
      setError(t("feedback.submitError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-ocean-dark">
      <View className="mb-8 h-fit flex-row items-center justify-start gap-2 border-b border-black-100/20 bg-ocean-dark px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-linen">
          {t("feedback.title")}
        </Text>

        <LinearGradient
          colors={["#000", "transparent"]}
          style={{
            position: "absolute",
            bottom: -20,
            left: 0,
            right: 0,
            height: 20,
            zIndex: 100,
          }}
        />
      </View>

      <View className="flex-1 px-6">
        <Text className="mb-6 text-lg leading-relaxed text-linen/90">
          {t("feedback.description")}
        </Text>

        <FormError error={error} />

        <View className="flex-1">
          <TextField
            label={t("feedback.name")}
            name="name"
            control={control}
            error={errors.name}
            placeholder={t("feedback.placeholder.name")}
          />

          <TextField
            label={t("feedback.email")}
            name="email"
            control={control}
            error={errors.email}
            placeholder={t("feedback.placeholder.email")}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextField
            label={t("feedback.subject")}
            name="subject"
            control={control}
            error={errors.subject}
            placeholder={t("feedback.placeholder.subject")}
          />

          <TextField
            label={t("feedback.message")}
            name="message"
            control={control}
            error={errors.message}
            placeholder={t("feedback.placeholder.message")}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          className="mb-8 rounded-full bg-primary-100 py-4"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <Text className="text-center font-rubik-medium text-lg text-black">
            {isLoading ? t("feedback.sending") : t("feedback.submit")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Feedback;
