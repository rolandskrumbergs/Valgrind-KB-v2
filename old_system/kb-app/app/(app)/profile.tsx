import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ImageBackground,
} from "react-native";
import React from "react";
import { useAuth } from "@/features/auth";
import { useTranslation } from "react-i18next";
import { Link } from "expo-router";
import Constants from "expo-constants";
import { useChatTokenAvailability } from "@/hooks/use-chat-token-availability";
import { ChevronRight } from "lucide-react-native";
import images from "@/constants/images";
import { LinearGradient } from "expo-linear-gradient";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

const Profile = () => {
  const { t } = useTranslation();
  const { signOut, session, deleteAccount } = useAuth();
  const { tokenInfo, isLoading, error, refetch } = useChatTokenAvailability();

  // Refetch token availability when screen comes into focus
  useRefreshOnFocus(refetch);

  // Get user initials
  const getInitials = () => {
    const firstName = session?.user?.name || "";
    const lastName = session?.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t("profile.deleteAccountConfirmTitle", {
        defaultValue: "Delete Account",
      }),
      t("profile.deleteAccountConfirmMessage", {
        defaultValue:
          "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
      }),
      [
        {
          text: t("profile.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
        {
          text: t("profile.delete", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: () => {
            (async () => {
              try {
                await deleteAccount();
              } catch (error) {
                console.error("Error deleting account:", error);
                Alert.alert(
                  t("profile.deleteAccountErrorTitle", {
                    defaultValue: "Error",
                  }),
                  error instanceof Error
                    ? error.message
                    : t("profile.deleteAccountError", {
                        defaultValue:
                          "Failed to delete account. Please try again.",
                      })
                );
              }
            })();
          },
        },
      ]
    );
  };

  // Calculate remaining tokens
  const remainingTokens = tokenInfo
    ? tokenInfo.totalTokensAvailable - tokenInfo.totalTokensUsed
    : 0;

  return (
    <View className="flex-1">
      <ImageBackground
        source={images.heroBg}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Gradient Overlay - Opacity at top, solid bg-page-bg at bottom */}
        <LinearGradient
          colors={["rgba(30, 36, 43, 0.7)", "#1e242b"]}
          locations={[0, 0.3]}
          className="absolute inset-0"
        />

        {/* Content */}
        <ScrollView className="flex-1">
          <View className="gap-6 px-4 py-8">
            {/* User Profile Header */}
            <View className="items-center justify-center py-10">
              {/* Initials Circle */}
              <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
                <Text className="text-2xl font-bold text-white">
                  {getInitials()}
                </Text>
              </View>

              {/* Name and Email */}
              <View className="mt-4 items-center">
                <Text className="text-xl font-bold uppercase text-white">
                  {session?.user?.name} {session?.user?.lastName}
                </Text>
                <Text className="text-sm text-gray-300">
                  {session?.user?.email}
                </Text>
              </View>
            </View>

            {/* Organization Card */}
            {session?.user?.organization && (
              <View className="rounded-lg bg-muted shadow-lg">
                {/* Organization Name */}
                <View className="px-6 py-6">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base text-gray-400">
                      {t("profile.organization")}
                    </Text>
                    <Text className="text-right text-lg font-bold text-white">
                      {session?.user?.organization}
                    </Text>
                  </View>
                </View>
                <View className="mx-6 h-[1px] bg-gray-400" />

                {/* License Status */}
                <View className="px-6 py-6">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base text-gray-400">
                      {t("profile.licenseStatus")}
                    </Text>
                    <View className="rounded-full border-[#a9b299]/30  bg-[#a9b299]/20 px-3 py-1.5 font-bold">
                      <Text className="text-sm font-semibold text-[#a9b299]">
                        {session?.user?.hasLicense
                          ? t("profile.hasLicense")
                          : t("profile.noLicense")}
                      </Text>
                    </View>
                  </View>
                </View>
                {session?.user?.hasLicense && !isLoading && !error && (
                  <View className="mx-6 h-[1px] bg-gray-400" />
                )}

                {/* Chat Tokens */}
                {session?.user?.hasLicense && !isLoading && !error && (
                  <View className="px-6 py-6">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base text-gray-400">
                        {t("profile.chatTokensRemaining", {
                          defaultValue: "Chatt-token kvar",
                        })}
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{ color: "#5593AC" }}
                      >
                        {remainingTokens}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Settings Section */}
            <View className="gap-3">
              <Text className="text-base font-bold uppercase text-white">
                {t("profile.settingsTitle")}
              </Text>

              <Link href="/settings/contact" asChild>
                <Pressable className="mb-1 overflow-hidden rounded-lg bg-muted">
                  <View className="flex-row items-center justify-between px-4 py-5">
                    <Text className="text-md font-semibold text-white">
                      {t("profile.contact")}
                    </Text>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </View>
                </Pressable>
              </Link>

              <Link href="/settings/privacy-policy" asChild>
                <Pressable className="mb-1 overflow-hidden rounded-lg bg-muted">
                  <View className="flex-row items-center justify-between px-4 py-5">
                    <Text className="text-md font-semibold text-white">
                      {t("profile.privacy")}
                    </Text>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </View>
                </Pressable>
              </Link>

              {session?.user?.hasLicense && (
                <Link href="/settings/purchase-policy" asChild>
                  <Pressable className="mb-1 overflow-hidden rounded-lg bg-muted">
                    <View className="flex-row items-center justify-between px-4 py-5">
                      <Text className="text-md font-semibold text-white">
                        {t("profile.extraChat.title")}
                      </Text>
                      <ChevronRight size={18} color="#9CA3AF" />
                    </View>
                  </Pressable>
                </Link>
              )}
            </View>

            {/* Security Section */}
            <View className="gap-3">
              <Text className="text-base font-bold uppercase text-white">
                {t("profile.securityTitle")}
              </Text>

              <Pressable
                className="rounded-lg border-[0.5px] border-red-500 bg-nav-bg p-4"
                onPress={handleLogout}
              >
                <Text className="text-left text-base font-semibold text-red-500">
                  {t("profile.logout")}
                </Text>
              </Pressable>

              <Pressable
                className="rounded-lg border-[0.5px] border-gray-400 p-4"
                onPress={handleDeleteAccount}
              >
                <Text className="text-left text-base text-gray-400">
                  {t("profile.deleteAccount")}
                </Text>
              </Pressable>
            </View>

            {/* Version */}
            <Text className="text-left text-xs text-gray-500">
              v{Constants.expoConfig?.version ?? "N/A"}
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default Profile;
