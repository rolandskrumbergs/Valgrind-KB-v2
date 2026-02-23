import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useAuth } from "@/features/auth";

const REVENUECAT_API_KEY_IOS = "appl_QaxMocwsqTBeEXTevSrUggnXIKW";
const REVENUECAT_API_KEY_ANDROID = "goog_kWADqXVCPHLcXokZuCEzaIyKgzG";

/**
 * Hook to initialize RevenueCat only when user is authenticated.
 * This prevents network errors when fetching products before sign-in.
 */
export const useRevenueCat = () => {
  const { session, isAuthenticated } = useAuth();
  const isConfigured = useRef(false);

  useEffect(() => {
    // Only configure RevenueCat when user is authenticated and not already configured
    if (isAuthenticated && session?.user?.id && !isConfigured.current) {
      const initializeRevenueCat = async () => {
        try {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);

          const apiKey =
            Platform.OS === "ios"
              ? REVENUECAT_API_KEY_IOS
              : REVENUECAT_API_KEY_ANDROID;

          Purchases.configure({ apiKey });

          // Log in the user to RevenueCat with their session ID
          await Purchases.logIn(session.user.id);

          isConfigured.current = true;
          console.log("RevenueCat configured for user:", session.user.id);
        } catch (error) {
          console.error("Failed to configure RevenueCat:", error);
        }
      };

      initializeRevenueCat();
    }
  }, [isAuthenticated, session?.user?.id]);
};
