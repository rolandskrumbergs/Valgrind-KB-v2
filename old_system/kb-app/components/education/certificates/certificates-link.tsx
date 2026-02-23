import { FileBadge } from 'lucide-react-native';
import { View, Pressable, Text } from 'react-native';
import React, { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useCertificatesQuery } from '@/features/education/use-certificate';
import { useTranslation } from 'react-i18next';

const CertificatesLink = () => {
  const { data, refetch } = useCertificatesQuery();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (!data?.length) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push(`/(app)/education/certificates`)}
      className="mb-8 ml-2 mr-2 h-fit flex-row gap-3 rounded-lg border border-black-100/20 bg-linen p-3"
    >
      <View>
        <FileBadge size={55} color="#A2C4C9" />
      </View>
      <View>
        <Text className="mb-1 text-xl font-bold text-gray-800">{t('certificates.title')}</Text>
        <Text className="mb-1 text-base text-ocean">{t('certificates.description')}</Text>
      </View>
    </Pressable>
  );
};

export default CertificatesLink;
