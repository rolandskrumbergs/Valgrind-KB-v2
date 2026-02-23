import React, { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import { initI18n } from "@/services/i18n";
import { useRevenueCat } from "@/hooks/use-revenue-cat";
import { useAppState } from "@/hooks/use-app-state";
import "./globals.css";
import { initializeConsoleTracking } from "@/utils/consoleLogger";
import { usePushNotifications } from "@/hooks/use-push-notifications";

// Initialize console tracking
initializeConsoleTracking();

// Ignore specific warnings that might cause navigation issues
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
  "The action 'NAVIGATE' was not handled by any navigator",
  "Navigation state is missing required property",
  "Attempting to navigate before mounting the Root component",
]);

if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Component that initializes services after AuthProvider is available
function ServiceInitializer() {
  const { expoPushToken } = usePushNotifications();
  useRevenueCat();
  useAppState();

  useEffect(() => {
    if (expoPushToken) {
      console.log("Push token registered:", expoPushToken);
    }
  }, [expoPushToken]);

  return null;
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  // Load Rajdhani fonts
  /* eslint-disable @typescript-eslint/no-require-imports */
  const [fontsLoaded] = useFonts({
    "Rajdhani-Regular": require("../assets/fonts/Rajdhani-Regular.ttf"),
    "Rajdhani-Medium": require("../assets/fonts/Rajdhani-Medium.ttf"),
    "Rajdhani-SemiBold": require("../assets/fonts/Rajdhani-SemiBold.ttf"),
    "Rajdhani-Bold": require("../assets/fonts/Rajdhani-Bold.ttf"),
    "Rajdhani-Light": require("../assets/fonts/Rajdhani-Light.ttf"),
  });
  /* eslint-enable @typescript-eslint/no-require-imports */

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (i18nReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [i18nReady, fontsLoaded]);

  const [queryClient] = useState(() => new QueryClient());

  if (!i18nReady || !fontsLoaded) {
    // Keep splash screen visible until i18n and fonts are ready
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ServiceInitializer />
        <Slot />
      </AuthProvider>
    </QueryClientProvider>
  );
}
