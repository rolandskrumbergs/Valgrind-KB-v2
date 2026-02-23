import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
} from "react-native";
import React from "react";
import LatestNews from "@/components/news/latest-news";
import { router } from "expo-router";
import LatestChats from "@/components/chat/latest-chats";
import CoursesCarousel from "@/components/education/courses-carousel";
import { useAuth } from "@/features/auth";
import { useTranslation } from "react-i18next";
import images from "@/constants/images";
import { ArrowRight, Loader2 } from "lucide-react-native";
import { useCoursesQuery } from "@/features/education";

const Dashboard = () => {
  const { t } = useTranslation();
  const { session } = useAuth();

  const { data: courses, isLoading, error } = useCoursesQuery();

  const basicTrainingCourse = courses?.find(
    (course) => Number(course.courseId) === 2
  );

  const handleCoursePress = (courseId: string) => {
    router.push({
      pathname: "/education/course/[courseId]",
      params: { courseId },
    });
  };

  const handleBasicTrainingPress = () => {
    router.push({
      pathname: "/education/course/[courseId]",
      params: { courseId: "2" },
    });
  };

  const handleLenaCardPress = () => {
    // Navigate to the lena-chat tab
    router.push("/lena-chat");
  };

  const renderBasicTrainingCard = () => {
    if (isLoading) {
      return (
        <View className="h-32 overflow-hidden rounded-lg bg-card">
          <View className="flex h-full items-center justify-center">
            <Loader2 size={32} color="#FFFFFF" className="animate-spin" />
          </View>
        </View>
      );
    }

    if (error) {
      return (
        <View className="h-32 overflow-hidden rounded-lg bg-card">
          <View className="flex h-full items-center justify-center px-4">
            <Text className="text-center text-sm text-red-400">
              {t("home.basicTrainingError")}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <Pressable
        onPress={handleBasicTrainingPress}
        className="h-32 overflow-hidden rounded-lg bg-page-foreground active:opacity-80"
      >
        <View className="flex h-full flex-row items-stretch">
          <ImageBackground
            source={{
              uri: basicTrainingCourse?.imageUrl || "",
            }}
            className="h-full w-[33%]"
            resizeMode="cover"
          />
          <View className="flex-1 justify-center px-4 py-4">
            <Text className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
              {t("home.basicTrainingTitle")}
            </Text>
            <Text className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {t("home.basicTrainingSubtitle")}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1">
      <ImageBackground
        source={images.bg3v2}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Content */}
        <ScrollView className="flex-1">
          <View className="w-full gap-6 px-4 py-6">
            {/* Welcome Section */}
            <View className="gap-1 ">
              <Text className="mb-1 text-2xl font-bold uppercase tracking-tight text-white">
                {t("home.welcomeTitle")}
              </Text>
              <Text className="text-sm text-white">
                {t("home.welcomeSubtitle")}
              </Text>
            </View>

            {/* Basic Training Card */}
            {renderBasicTrainingCard()}

            {/* Courses Carousel Section */}
            <View className="py-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xl font-bold uppercase tracking-wide text-white">
                  {t("home.coursesTitle")}
                </Text>
                <Pressable onPress={() => router.push("/education")}>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm text-white underline">
                      {t("dashboard.viewAll")}
                    </Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </View>
                </Pressable>
              </View>
              <CoursesCarousel
                courses={courses || []}
                onCoursePress={handleCoursePress}
                isLoading={isLoading}
              />
            </View>

            {/* Lena AI Section */}
            <View className="gap-3">
              <Text className="text-xl font-bold uppercase tracking-wide text-white">
                {t("home.lenaTitle")}
              </Text>
              <Pressable
                onPress={handleLenaCardPress}
                className="h-32 overflow-hidden rounded-lg bg-card active:opacity-80"
              >
                <View className="flex h-full flex-row items-stretch">
                  <View className="h-full w-[33%]" pointerEvents="none">
                    <ImageBackground
                      source={{
                        uri: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop",
                      }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View
                    className="flex-1 justify-center px-4 py-4"
                    pointerEvents="none"
                  >
                    <Text className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
                      {t("home.lenaTitle")}
                    </Text>
                    <Text className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {t("home.lenaSubtitle")}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Latest Conversations Section - Only show if user has license */}
            {session?.user?.hasLicense && (
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-md font-bold text-white">
                    {t("home.latestConversationsTitle")}
                  </Text>
                </View>
                <LatestChats />
              </View>
            )}

            {/* Latest News Section */}
            <View className="gap-3 pb-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold uppercase tracking-wide text-white">
                  {t("home.latestNewsTitle")}
                </Text>
                <Pressable onPress={() => router.push("/news")}>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm text-white underline">
                      {t("dashboard.viewAll")}
                    </Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </View>
                </Pressable>
              </View>
              <LatestNews />
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default Dashboard;
