import React from 'react';
import { View, Text, ActivityIndicator, SectionList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChatsQuery } from '@/features/chats/use-chats-query';
import renderChatItem from './chat-list-item';

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const isLastWeek = (date: Date) => {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= lastWeek && date < today && !isToday(date) && !isYesterday(date);
};

const isLastMonth = (date: Date) => {
  const today = new Date();
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  return (
    date >= lastMonth && date < today && !isToday(date) && !isYesterday(date) && !isLastWeek(date)
  );
};

const groupChats = (chats: any[]) => {
  const groups = {
    today: [] as any[],
    yesterday: [] as any[],
    lastWeek: [] as any[],
    lastMonth: [] as any[],
    older: [] as any[],
  };

  for (const chat of chats) {
    const date = new Date(chat.createdAt);
    if (isToday(date)) {
      groups.today.push(chat);
    } else if (isYesterday(date)) {
      groups.yesterday.push(chat);
    } else if (isLastWeek(date)) {
      groups.lastWeek.push(chat);
    } else if (isLastMonth(date)) {
      groups.lastMonth.push(chat);
    } else {
      groups.older.push(chat);
    }
  }

  return [
    { title: 'Today', data: groups.today },
    { title: 'Yesterday', data: groups.yesterday },
    { title: 'Last Week', data: groups.lastWeek },
    { title: 'Last Month', data: groups.lastMonth },
    { title: 'Older', data: groups.older },
  ].filter(section => section.data.length > 0);
};

const ListAllChats = () => {
  const { data: chats, isLoading, error, refetch } = useChatsQuery();
  const { t } = useTranslation();

  const groupChats = (chats: any[]) => {
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      lastWeek: [] as any[],
      lastMonth: [] as any[],
      older: [] as any[],
    };

    for (const chat of chats) {
      const date = new Date(chat.createdAt);
      if (isToday(date)) {
        groups.today.push(chat);
      } else if (isYesterday(date)) {
        groups.yesterday.push(chat);
      } else if (isLastWeek(date)) {
        groups.lastWeek.push(chat);
      } else if (isLastMonth(date)) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
    }

    return [
      { title: t('general.today'), data: groups.today },
      { title: t('general.yesterday'), data: groups.yesterday },
      { title: t('general.lastWeek'), data: groups.lastWeek },
      { title: t('general.lastMonth'), data: groups.lastMonth },
      { title: t('general.older'), data: groups.older },
    ].filter(section => section.data.length > 0);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-4">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading chats';
    return (
      <View className="mt-2 rounded-lg bg-red-900/30 p-4">
        <Text className="text-white">Error loading chats: {errorMessage}</Text>
      </View>
    );
  }

  if (chats?.length === 0) {
    return (
      <View className="py-4">
        <Text className="text-center text-white">No chats available</Text>
      </View>
    );
  }

  if (!chats) {
    return (
      <View className="py-4">
        <Text className="text-center text-white">No chats available</Text>
      </View>
    );
  }

  const groupedChats = groupChats(chats);

  return (
    <View className="flex-1 " style={{ backgroundColor: '#2a3d4c' }}>
      <SectionList
        sections={groupedChats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderChatItem({ item })}
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-2 pb-2 pt-1">
            <Text className="text-lg font-medium text-sage">{title}</Text>
          </View>
        )}
        className="mt-2 px-2"
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

export default ListAllChats;
