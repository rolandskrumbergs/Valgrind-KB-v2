import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import ListAllCertificates from "@/components/education/certificates/list-all-certificates";
import { useCertificatesQuery } from "@/features/education/use-certificate";
import { useTranslation } from "react-i18next";

const Certificates = () => {
  const { t } = useTranslation();
  const { shareCertificatePdf, downloadCertificatePdf } =
    useCertificatesQuery();

  const handleDownload = (courseId?: number, courseTitle?: string) => {
    downloadCertificatePdf(courseId, courseTitle, t);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">
          {t("general.myCertificates")}
        </Text>
      </View>

      <View className="relative flex-1 bg-nav-bg px-4 pt-5">
        <ListAllCertificates
          onShare={shareCertificatePdf}
          onDownload={handleDownload}
        />
      </View>
    </SafeAreaView>
  );
};

export default Certificates;
