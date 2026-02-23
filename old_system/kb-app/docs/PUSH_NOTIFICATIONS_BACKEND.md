# Backend Implementation Guide for Push Notifications

This guide covers the backend implementation needed in your NextJS/PostgreSQL admin app to support push notifications for news publishing.

## 1. Database Schema

Add a new table to store push tokens:

```sql
-- Create push_tokens table
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(expo_push_token);
```

## 2. Install Expo Server SDK

```bash
npm install expo-server-sdk
# or
yarn add expo-server-sdk
```

## 3. API Endpoint to Store Push Tokens

Create an API route to receive and store push tokens from the mobile app:

```typescript
// app/api/expo/push-tokens/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your database connection

export async function POST(request: NextRequest) {
  try {
    const { userId, expoPushToken, platform } = await request.json();

    // Validate request
    if (!userId || !expoPushToken || !platform) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user ID from headers matches request body
    const headerUserId = request.headers.get("User-ID");
    if (headerUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Upsert push token (insert or update if exists)
    await db.query(
      `INSERT INTO push_tokens (user_id, expo_push_token, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (expo_push_token)
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         platform = EXCLUDED.platform,
         updated_at = NOW()`,
      [userId, expoPushToken, platform]
    );

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Error storing push token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove token when user logs out
// This is automatically called by the mobile app when users sign out
export async function DELETE(request: NextRequest) {
  try {
    const { expoPushToken } = await request.json();

    if (!expoPushToken) {
      return NextResponse.json(
        { error: "Missing expoPushToken" },
        { status: 400 }
      );
    }

    await db.query("DELETE FROM push_tokens WHERE expo_push_token = $1", [
      expoPushToken,
    ]);

    return NextResponse.json({
      success: true,
      message: "Push token removed successfully",
    });
  } catch (error) {
    console.error("Error removing push token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 4. Push Notification Service

Create a service to send push notifications:

```typescript
// services/notifications/pushNotificationService.ts
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { db } from "@/lib/db";

// Create a new Expo SDK client
const expo = new Expo();

export interface SendNewsNotificationParams {
  newsId: string;
  newsTitle: string;
  newsExcerpt?: string;
  targetUserIds?: string[]; // Optional: target specific users
}

/**
 * Send push notifications to users when news is published
 */
export async function sendNewsNotification({
  newsId,
  newsTitle,
  newsExcerpt,
  targetUserIds,
}: SendNewsNotificationParams): Promise<ExpoPushTicket[]> {
  try {
    // Fetch push tokens from database
    let query = "SELECT expo_push_token FROM push_tokens";
    let params: any[] = [];

    if (targetUserIds && targetUserIds.length > 0) {
      query += " WHERE user_id = ANY($1)";
      params = [targetUserIds];
    }

    const result = await db.query(query, params);
    const pushTokens = result.rows.map((row) => row.expo_push_token);

    if (pushTokens.length === 0) {
      console.log("No push tokens found");
      return [];
    }

    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter((token) =>
      Expo.isExpoPushToken(token)
    );

    if (validTokens.length === 0) {
      console.log("No valid Expo push tokens found");
      return [];
    }

    // Create push messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Nya nyheter",
      body: newsTitle,
      data: {
        newsId,
        screen: `/(app)/news/${newsId}`,
        type: "news",
      },
      badge: 1,
      priority: "high",
    }));

    // Split messages into chunks (Expo recommends chunks of 100)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    // Send notifications in chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`Sent ${ticketChunk.length} push notifications`);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    // Check for errors in tickets
    const errors = tickets.filter((ticket) => ticket.status === "error");
    if (errors.length > 0) {
      console.error("Push notification errors:", errors);

      // Remove invalid tokens from database
      for (const ticket of errors) {
        if (
          "details" in ticket &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          // Remove expired token from database
          await db.query(
            "DELETE FROM push_tokens WHERE expo_push_token = $1",
            [ticket.message] // This contains the token
          );
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error("Error in sendNewsNotification:", error);
    throw error;
  }
}

/**
 * Send notifications to users with specific licenses
 */
export async function sendNewsNotificationToLicensedUsers(
  params: SendNewsNotificationParams
) {
  const result = await db.query(
    `SELECT DISTINCT u.id 
     FROM users u 
     WHERE u.has_license = true`
  );

  const userIds = result.rows.map((row) => row.id);

  return sendNewsNotification({
    ...params,
    targetUserIds: userIds,
  });
}
```

## 5. Integration with News Publishing

When publishing news, trigger the notification:

```typescript
// app/admin/news/actions.ts (or wherever you handle news publishing)
import {
  sendNewsNotification,
  sendNewsNotificationToLicensedUsers,
} from "@/services/notifications/pushNotificationService";

export async function publishNews(newsId: string) {
  try {
    // Update news status to published
    const news = await db.query(
      `UPDATE news 
       SET status = 'published', published_at = NOW() 
       WHERE id = $1 
       RETURNING id, title, excerpt`,
      [newsId]
    );

    if (news.rows.length === 0) {
      throw new Error("News not found");
    }

    const { id, title, excerpt } = news.rows[0];

    // Send push notifications to all users (or licensed users only)
    // Option 1: Send to all users
    await sendNewsNotification({
      newsId: id,
      newsTitle: title,
      newsExcerpt: excerpt,
    });

    // Option 2: Send only to users with active licenses
    // await sendNewsNotificationToLicensedUsers({
    //   newsId: id,
    //   newsTitle: title,
    //   newsExcerpt: excerpt,
    // });

    console.log("News published and notifications sent:", id);
    return { success: true, newsId: id };
  } catch (error) {
    console.error("Error publishing news:", error);
    throw error;
  }
}
```

## 6. Environment Variables

Add to your `.env` file if needed:

```env
# Push notifications are handled by Expo, no additional config needed
# But you may want to track usage
EXPO_PUSH_NOTIFICATION_ENABLED=true
```

## 7. Testing Push Notifications

You can test push notifications using curl:

```bash
# Test sending a notification directly
curl -H "Content-Type: application/json" \
     -X POST "https://exp.host/--/api/v2/push/send" \
     -d '{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Test Notification",
  "body": "This is a test news notification",
  "data": {
    "newsId": "123",
    "screen": "/(app)/news/123"
  }
}'
```

## 8. Monitoring and Error Handling

Consider implementing:

1. **Receipt checking**: After sending notifications, check receipts to see if they were delivered
2. **Token cleanup**: Remove invalid/expired tokens from the database
3. **Analytics**: Track notification open rates
4. **Retry logic**: Retry failed notifications

```typescript
// Optional: Check notification receipts
export async function checkNotificationReceipts(ticketIds: string[]) {
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];

        if (receipt.status === "error") {
          console.error("Error in receipt:", receipt);

          if (receipt.details?.error === "DeviceNotRegistered") {
            // Remove token from database
            // Implementation depends on how you store ticket-to-token mapping
          }
        }
      }
    } catch (error) {
      console.error("Error checking receipts:", error);
    }
  }
}
```

## 9. Security Considerations

1. **Validate User-ID header**: Always verify the user making the request
2. **Rate limiting**: Implement rate limiting on the push token endpoint
3. **Token validation**: Validate Expo push tokens before storing
4. **CORS configuration**: Ensure your API only accepts requests from your mobile app

## 10. Next Steps

1. Create the `push_tokens` table in your PostgreSQL database
2. Implement the `/api/expo/push-tokens` endpoint
3. Create the `pushNotificationService.ts` file
4. Integrate notification sending into your news publishing flow
5. Test with a physical device (push notifications don't work in simulators)
6. Monitor logs for any errors or invalid tokens

## Notes

- Push notifications require a **physical device** for testing
- iOS requires additional Apple Push Notification service (APNs) setup via EAS Build
- Android uses Firebase Cloud Messaging (FCM), configured automatically by Expo
- The mobile app is already configured and will start sending tokens once you deploy this backend code
