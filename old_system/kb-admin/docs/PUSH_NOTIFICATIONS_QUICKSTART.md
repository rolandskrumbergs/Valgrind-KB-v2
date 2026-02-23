# Push Notifications - Quick Start Guide

## For Mobile App Developers

### 1. Register Push Token

When a user logs in or grants notification permissions, send their Expo push token to the backend:

```typescript
// Mobile app code (React Native/Expo)
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

async function registerPushToken(userId: string, authToken: string) {
  // Get Expo push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send to backend
  const response = await fetch("https://your-api.com/api/expo/push-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-ID": userId,
      Authorization: `Bearer ${authToken}`, // If using auth tokens
    },
    body: JSON.stringify({
      userId: userId,
      expoPushToken: token,
      platform: Platform.OS, // 'ios' or 'android'
    }),
  });

  const result = await response.json();
  console.log("Push token registered:", result);
}
```

### 2. Handle Incoming Notifications

```typescript
// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notification taps
Notifications.addNotificationResponseReceivedListener((response) => {
  const { newsId, screen } = response.notification.request.content.data;

  if (screen) {
    // Navigate to the news article
    navigation.navigate(screen); // e.g., "/(app)/news/uuid"
  }
});
```

### 3. Remove Token on Logout

```typescript
async function unregisterPushToken(expoPushToken: string) {
  await fetch("https://your-api.com/api/expo/push-tokens", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expoPushToken: expoPushToken,
    }),
  });
}
```

## For Backend/Admin Developers

### Manual Testing

You can test push notifications manually using curl:

```bash
# 1. Register a test token (get token from Expo mobile app)
curl -X POST http://localhost:3000/api/expo/push-tokens \
  -H "Content-Type: application/json" \
  -H "User-ID: test-user-id" \
  -d '{
    "userId": "test-user-id",
    "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios"
  }'

# 2. Publish a news article via admin UI
# This will automatically trigger push notifications

# 3. Check database for registered tokens
# Connect to PostgreSQL and run:
# SELECT * FROM push_tokens;
```

### Direct Notification Testing

To test notifications without publishing news:

```typescript
// Add to a test API route or run in a script
import { sendNewsNotification } from "@/lib/push-notification-service";

await sendNewsNotification({
  newsId: "test-news-id",
  newsTitle: "Test Notification",
  newsExcerpt: "This is a test notification",
});
```

## Notification Payload Structure

When a notification is sent, the mobile app receives:

```json
{
  "title": "Nya nyheter",
  "body": "News Article Title",
  "data": {
    "newsId": "uuid-of-news-article",
    "screen": "/(app)/news/uuid-of-news-article",
    "type": "news"
  },
  "sound": "default",
  "badge": 1,
  "priority": "high"
}
```

## Environment Setup

### Prerequisites

- ✅ Expo app configured for push notifications
- ✅ iOS: APNs certificate via EAS Build
- ✅ Android: FCM configuration (automatic with Expo)
- ✅ Physical device for testing (simulators don't support push)

### No additional environment variables needed

The system uses Expo's free push notification service.

## Monitoring

### Check Logs

Push notification activity is logged to console:

- Token registration/removal
- Notification send success/failure
- Invalid token cleanup

### Database Queries

```sql
-- Count registered tokens per platform
SELECT platform, COUNT(*) FROM push_tokens GROUP BY platform;

-- Find users with registered tokens
SELECT u.email, pt.platform, pt.created_at
FROM push_tokens pt
JOIN user u ON pt.user_id = u.id;

-- Recent notifications (check application logs)
```

## Troubleshooting

### Notifications not received?

1. ✅ Verify token is registered: `SELECT * FROM push_tokens WHERE user_id = 'xxx'`
2. ✅ Check console logs for send errors
3. ✅ Ensure user has granted notification permissions
4. ✅ Use physical device (not simulator)
5. ✅ Check app is in foreground/background (behavior differs)

### Token invalid errors?

- Invalid tokens are automatically removed from database
- User needs to re-register token (usually happens on next app launch)

### iOS notifications not working?

- Ensure APNs certificate is properly configured in EAS Build
- Check push notification capabilities in Xcode project
- Verify production/development environment settings

## Next Steps

1. **Test with physical device**: Get an Expo push token from your mobile app
2. **Register token**: Use the POST endpoint to register it
3. **Publish news**: Use admin panel to publish news and verify notification
4. **Monitor**: Check logs and database for successful delivery
5. **Production**: Deploy backend changes and test end-to-end

## Support

For issues:

- Check backend logs (console output)
- Check mobile app logs (Expo CLI output)
- Verify database state (`push_tokens` table)
- See full implementation docs: `docs/PUSH_NOTIFICATIONS_IMPLEMENTATION.md`
