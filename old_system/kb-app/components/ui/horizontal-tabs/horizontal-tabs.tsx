import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";

export type TabItem = {
  title: string;
  content: React.ReactNode;
};

type HorizontalTabsProps = {
  tabs: TabItem[];
  initialTabIndex?: number;
};

const HorizontalTabs = ({ tabs, initialTabIndex = 0 }: HorizontalTabsProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(
    initialTabIndex < tabs.length ? initialTabIndex : 0
  );

  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
    return (
      <View className="items-center justify-center p-4">
        <Text className="text-red-500">
          Tab data is not provided or invalid.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-col">
      <View className="flex-row border-b border-border bg-transparent">
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.title}
            onPress={() => setActiveTabIndex(index)}
            className={`relative flex-1 py-4 ${
              activeTabIndex === index ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-center text-base font-medium ${
                activeTabIndex === index
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-1 pt-4">{tabs[activeTabIndex]?.content}</View>
    </View>
  );
};

export default HorizontalTabs;
