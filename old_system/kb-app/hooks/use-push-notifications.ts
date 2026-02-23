import { useState, useEffect, useRef } from "react";
import { router, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from "@/services/notifications/pushNotifications";
import { useAuth } from "@/features/auth";

/**
 * Hook to manage push notifications lifecycle
 * - Registers device for push notifications
 * - Handles notification received while app is in foreground
 * - Handles notification taps and navigation
 */
export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    console.log("[usePushNotifications] Effect triggered");
    console.log(
      "[usePushNotifications] Session user ID:",
      session?.user?.id || "(not available)"
    );

    if (!session?.user?.id) {
      console.log("[usePushNotifications] No user ID, skipping registration");
      return;
    }

    // Register for push notifications
    console.log(
      "[usePushNotifications] Initiating push notification registration..."
    );
    registerForPushNotificationsAsync(session.user.id)
      .then((token) => {
        console.log(
          "[usePushNotifications] Registration completed. Token:",
          token || "(no token)"
        );
        setExpoPushToken(token);
      })
      .catch((error) => {
        console.error("[usePushNotifications] Registration failed:", error);
      });

    // Check if app was opened from a notification tap
    console.log(
      "[usePushNotifications] Checking for last notification response..."
    );
    getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log(
          "[usePushNotifications] Found notification response:",
          response.notification.request.content.data
        );
        handleNotificationResponse(response);
      } else {
        console.log("[usePushNotifications] No pending notification response");
      }
    });

    // Handle notification received while app is in foreground
    console.log("[usePushNotifications] Setting up notification listeners");
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log(
          "[usePushNotifications] Notification received:",
          notification.request.content
        );
        setNotification(notification);
      }
    );

    // Handle notification tap
    responseListener.current = addNotificationResponseReceivedListener(
      (response) => {
        console.log(
          "[usePushNotifications] Notification tapped:",
          response.notification.request.content.data
        );
        handleNotificationResponse(response);
      }
    );

    return () => {
      console.log("[usePushNotifications] Cleaning up notification listeners");
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session?.user?.id]);

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;
    console.log(
      "[usePushNotifications] Handling notification response. Data:",
      data
    );

    // Navigate to news detail if newsId is present
    if (data.newsId && typeof data.newsId === "string") {
      console.log("[usePushNotifications] Navigating to news:", data.newsId);
      router.push(`/(app)/news/${data.newsId}` as Href);
    } else if (data.screen && typeof data.screen === "string") {
      console.log("[usePushNotifications] Navigating to screen:", data.screen);
      router.push(data.screen as Href);
    } else {
      console.log(
        "[usePushNotifications] No navigation target in notification data"
      );
    }
  };

  return {
    expoPushToken,
    notification,
  };
};
