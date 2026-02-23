import { View, Text, ImageBackground, Pressable } from "react-native";
import React from "react";
import HorizontalTabs from "@/components/ui/horizontal-tabs";
import CoursesList from "@/components/education/courses-list";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import images from "@/constants/images";
import { Award, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { useCertificatesQuery } from "@/features/education/use-certificate";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

const Education = () => {
  const { t } = useTranslation();
  const { data: certificates, refetch } = useCertificatesQuery();

  useRefreshOnFocus(refetch);

  const educationModuleTabs = [
    { title: t("education.tabs.all"), content: <CoursesList /> },
    {
      title: t("education.tabs.ongoing"),
      content: <CoursesList courseStatus="in_progress" />,
    },
    {
      title: t("education.tabs.finished"),
      content: <CoursesList courseStatus="completed" />,
    },
  ];

  return (
    <View className="flex-1 bg-page-bg">
      <ImageBackground
        source={images.coursesBg}
        className="w-full"
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(18, 18, 18, 0.4)", "#1e242b"]}
          locations={[0, 1]}
          className="pt-8"
        >
          <Text className="mb-6 px-4 text-2xl font-bold uppercase tracking-wide text-white">
            {t("education.title")}
          </Text>
          {certificates && certificates.length > 0 && (
            <Pressable
              onPress={() => router.push("/(app)/education/certificates")}
              className="mx-4 mb-6 rounded-lg p-6 pb-10"
              style={{
                backgroundColor: "#1e242b",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="mb-3 flex-row items-center gap-3">
                <Award size={24} color="#5593AC" strokeWidth={2} />
                <Text className="text-lg font-bold uppercase tracking-wide text-white">
                  {t("general.myCertificates")}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-md text-gray-400">
                  {t("certificates.viewSubtitle")}
                </Text>
                <ArrowRight size={16} color="#8899A6" strokeWidth={2} />
              </View>
            </Pressable>
          )}
        </LinearGradient>
      </ImageBackground>
      <View className="relative flex-1">
        <HorizontalTabs tabs={educationModuleTabs} initialTabIndex={0} />
      </View>
    </View>
  );
};

export default Education;
