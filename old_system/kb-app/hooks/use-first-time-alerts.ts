import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const createStorageKey = (userId: string, type: "warning" | "info") =>
  `@chat_${type}_shown_${userId}`;

export const useFirstTimeAlerts = (userId: string) => {
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  const [shouldShowInfo, setShouldShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const [warningShown, infoShown] = await Promise.all([
          AsyncStorage.getItem(createStorageKey(userId, "warning")),
          AsyncStorage.getItem(createStorageKey(userId, "info")),
        ]);

        setShouldShowWarning(warningShown === null);
        setShouldShowInfo(infoShown === null);
      } catch (error) {
        console.error("Error checking first-time alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void checkFirstTime();
  }, [userId]);

  const markWarningShown = async () => {
    try {
      await AsyncStorage.setItem(createStorageKey(userId, "warning"), "true");
      setShouldShowWarning(false);
    } catch (error) {
      console.error("Error marking warning as shown:", error);
    }
  };

  const markInfoShown = async () => {
    try {
      await AsyncStorage.setItem(createStorageKey(userId, "info"), "true");
      setShouldShowInfo(false);
    } catch (error) {
      console.error("Error marking info as shown:", error);
    }
  };

  return {
    shouldShowWarning,
    shouldShowInfo,
    markWarningShown,
    markInfoShown,
    isLoading,
  };
};
