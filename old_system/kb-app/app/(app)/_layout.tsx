import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Home, User, BookOpen, Sparkles } from "lucide-react-native";
import { View, Pressable, Dimensions } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { withTiming, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "@/components/layout/app-header";
import { useTranslation } from "react-i18next";

// Colors matching the design from the image and theme tokens
const activeColor = "#5593AC"; // text-primary color
const inactiveColor = "#8899A6"; // text-nav-foreground color

const { width: screenWidth } = Dimensions.get("window");

// Custom Tab Bar Component
function CustomTabBar({
  state,
  descriptors,
  navigation,
}: Readonly<BottomTabBarProps>) {
  // Filter only visible tabs (those with tabBarIcon)
  const visibleRoutes = state.routes.filter(
    (route) => descriptors[route.key]?.options?.tabBarIcon
  );
  const totalTabs = visibleRoutes.length;
  const tabWidth = totalTabs > 0 ? screenWidth / totalTabs : screenWidth;
  const translateX = useSharedValue(0);

  // Find the index of the current focused route among visible tabs
  const focusedVisibleIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index].key
  );

  useEffect(() => {
    if (focusedVisibleIndex !== -1) {
      translateX.value = withTiming(focusedVisibleIndex * tabWidth + 20, {
        duration: 150,
      });
    }
  }, [focusedVisibleIndex, tabWidth, translateX]);

  return (
    <View className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background bg-nav-bg">
      {/* Tab Buttons */}
      <View className="flex h-20 w-full flex-row items-center justify-evenly">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Skip routes without tabBarIcon (hidden routes)
          if (!options.tabBarIcon) {
            return null;
          }

          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const TabBarIcon = options.tabBarIcon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                options.tabBarAccessibilityLabel ?? String(label)
              }
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              {TabBarIcon ? (
                <TabBarIcon
                  focused={isFocused}
                  color={isFocused ? activeColor : inactiveColor}
                  size={24}
                />
              ) : (
                <View className="h-6 w-6" />
              )}
              <Animated.Text
                style={{
                  fontSize: 12,
                  color: isFocused ? activeColor : inactiveColor,
                  textAlign: "center",
                }}
              >
                {String(label)}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const ProtectedLayout = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1">
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "shift",
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="education/index"
          options={{
            title: t("tabs.education"),
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lena-chat/index"
          options={{
            title: t("tabs.lenaAI"),
            tabBarIcon: ({ color, size }) => (
              <Sparkles size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="education/certificates"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="education/course/[courseId]"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="lena-chat/all-chats"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="lena-chat/[id]"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings/contact"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings/feedback"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings/privacy-policy"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings/purchase-policy"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default ProtectedLayout;
