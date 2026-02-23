import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import apiClient from "@/services/apiClient";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushTokenResponse {
  expoPushToken: string;
}

// Store the current push token for cleanup on logout
let currentPushToken: string | undefined;
let currentUserId: string | undefined;

/**
 * Register for push notifications and send token to backend
 * @param userId - The authenticated user's ID
 * @returns The Expo push token or undefined if registration failed
 */
export async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | undefined> {
  console.log("[PushNotifications] Starting registration for userId:", userId);
  let token;

  if (Platform.OS === "android") {
    console.log("[PushNotifications] Configuring Android notification channel");
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5593AC",
    });
  }

  if (Device.isDevice) {
    console.log("[PushNotifications] Running on physical device");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log(
      "[PushNotifications] Existing permission status:",
      existingStatus
    );
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("[PushNotifications] Requesting permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log(
        "[PushNotifications] Permission request result:",
        finalStatus
      );
    }

    if (finalStatus !== "granted") {
      console.warn(
        "[PushNotifications] Failed to get permission. Final status:",
        finalStatus
      );
      return;
    }

    console.log(
      "[PushNotifications] Permissions granted, proceeding with token generation"
    );

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log("[PushNotifications] Project ID:", projectId);
      console.log("[PushNotifications] Getting Expo push token...");
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("[PushNotifications] Token obtained:", token);

      // Send token to backend
      console.log("[PushNotifications] Sending token to backend API...");
      console.log("[PushNotifications] API endpoint: /api/expo/push-tokens");
      console.log("[PushNotifications] Payload:", {
        userId,
        expoPushToken: token,
        platform: Platform.OS,
      });

      const response = await apiClient.post(
        "/api/expo/push-tokens",
        {
          userId,
          expoPushToken: token,
          platform: Platform.OS,
        },
        {
          headers: {
            "User-ID": userId,
          },
        }
      );

      console.log("[PushNotifications] API response status:", response.status);
      console.log("[PushNotifications] API response data:", response.data);

      // Store token and userId for cleanup on logout
      currentPushToken = token;
      currentUserId = userId;

      console.log(
        "[PushNotifications] ✓ Push token successfully registered:",
        token
      );
    } catch (error) {
      console.error(
        "[PushNotifications] ✗ Error registering push token:",
        error
      );
      if (error instanceof Error) {
        console.error("[PushNotifications] Error message:", error.message);
        console.error("[PushNotifications] Error stack:", error.stack);
      }
    }
  } else {
    console.warn(
      "[PushNotifications] Not a physical device - push notifications not supported"
    );
  }

  console.log(
    "[PushNotifications] Registration complete. Token:",
    token || "(no token)"
  );
  return token;
}

/**
 * Handle notification received while app is foregrounded
 * @param callback - Function to call when notification is received
 * @returns Subscription object to clean up listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped notification)
 * @param callback - Function to call when user taps notification
 * @returns Subscription object to clean up listener
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response that opened the app
 * Useful for handling notification taps when app was closed
 */
export async function getLastNotificationResponseAsync() {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Remove push token from backend when user logs out
 * Uses the stored token and userId from registration
 */
export async function cleanupPushTokenOnLogout(): Promise<void> {
  console.log("[PushNotifications] Cleanup requested");
  if (!currentPushToken || !currentUserId) {
    console.log("[PushNotifications] No push token to cleanup");
    return;
  }

  console.log(
    "[PushNotifications] Removing token from backend:",
    currentPushToken
  );

  try {
    await apiClient.delete("/api/expo/push-tokens", {
      data: {
        expoPushToken: currentPushToken,
      },
      headers: {
        "User-ID": currentUserId,
      },
    });

    console.log(
      "[PushNotifications] ✓ Push token unregistered:",
      currentPushToken
    );

    // Clear stored values
    currentPushToken = undefined;
    currentUserId = undefined;
  } catch (error) {
    console.error(
      "[PushNotifications] ✗ Error unregistering push token:",
      error
    );
    // Don't throw error to prevent logout from failing
  }
}
