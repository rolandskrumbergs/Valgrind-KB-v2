import React from "react";
import { View, ActivityIndicator, FlatList, Text } from "react-native";
import { useCertificatesQuery } from "@/features/education/use-certificate";
import CertificateListItem from "./certificate-list-item";
import { useTranslation } from "react-i18next";

interface ListAllCertificatesProps {
  onShare: (courseId?: number) => void;
  onDownload: (courseId?: number, courseTitle?: string) => void;
}

const ItemSeparator = () => <View className="h-4" />;

const ListAllCertificates: React.FC<ListAllCertificatesProps> = ({
  onShare,
  onDownload,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useCertificatesQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-4">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View className="flex-1 items-center justify-center py-4">
        <Text className="text-base text-white">
          {t("certificates.noCertificates")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <CertificateListItem
            item={item}
            onShare={() => onShare(item.courseId)}
            onDownload={(courseId, courseTitle) =>
              onDownload(courseId, courseTitle)
            }
          />
        )}
        scrollEnabled={true}
        onRefresh={refetch}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  );
};

export default ListAllCertificates;
