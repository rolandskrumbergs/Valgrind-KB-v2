# Common Server Action Telemetry Patterns

This guide shows practical examples of adding telemetry to server actions.

## Pattern 1: Simple Action Logging

```typescript
"use server";

import { trackTrace } from "@/lib/telemetry-server";

export async function updateUserProfile(userId: string, data: ProfileData) {
  trackTrace("Updating user profile", "info", { userId });

  try {
    const result = await db.update(users).set(data).where(eq(users.id, userId));

    trackTrace("User profile updated successfully", "info", {
      userId,
      fieldsUpdated: Object.keys(data).length,
    });

    return { success: true };
  } catch (error) {
    trackTrace("Failed to update user profile", "error", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Update failed" };
  }
}
```

## Pattern 2: Action with Business Event

```typescript
"use server";

import { trackServerEvent, trackTrace } from "@/lib/telemetry-server";

export async function publishNews(newsId: string) {
  trackTrace("Publishing news article", "info", { newsId });

  const result = await db
    .update(newsTable)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(newsTable.id, newsId));

  // Track as business event for analytics
  trackServerEvent("news:published", {
    newsId,
    publishedAt: new Date().toISOString(),
  });

  trackTrace("News article published", "info", { newsId });

  return { success: true };
}
```

## Pattern 3: Action with Exception Tracking

```typescript
"use server";

import { trackServerException, trackTrace } from "@/lib/telemetry-server";

export async function processPayment(userId: string, amount: number) {
  trackTrace("Processing payment", "info", { userId, amount });

  try {
    const result = await paymentGateway.charge({
      userId,
      amount,
      currency: "USD",
    });

    trackTrace("Payment processed successfully", "info", {
      userId,
      amount,
      transactionId: result.id,
    });

    return { success: true, transactionId: result.id };
  } catch (error) {
    // Track exception for monitoring
    if (error instanceof Error) {
      trackServerException(error, {
        userId,
        amount,
        operation: "processPayment",
      });
    }

    trackTrace("Payment processing failed", "error", {
      userId,
      amount,
      error: error instanceof Error ? error.message : String(error),
    });

    return { success: false, error: "Payment failed" };
  }
}
```

## Pattern 4: Wrapped Server Action

```typescript
"use server";

import { withTelemetry } from "@/lib/telemetry-server";
import { trackTrace } from "@/lib/telemetry-server";

export const createCustomer = withTelemetry(
  "createCustomer",
  async (data: CustomerData) => {
    trackTrace("Creating new customer", "info", {
      companyName: data.name,
    });

    const customer = await db.insert(customersTable).values(data).returning();

    trackTrace("Customer created", "info", {
      customerId: customer[0].id,
      companyName: data.name,
    });

    return { success: true, customer: customer[0] };
  },
);
```

## Pattern 5: Multi-step Operation

```typescript
"use server";

import { trackTrace, trackServerEvent } from "@/lib/telemetry-server";

export async function uploadAndProcessDocument(file: File, userId: string) {
  const operationId = crypto.randomUUID();

  trackTrace("Starting document upload", "info", {
    operationId,
    userId,
    fileName: file.name,
    fileSize: file.size,
  });

  try {
    // Step 1: Upload to S3
    trackTrace("Uploading to S3", "info", { operationId });
    const s3Url = await uploadToS3(file);
    trackTrace("S3 upload complete", "info", { operationId, s3Url });

    // Step 2: Create DB record
    trackTrace("Creating database record", "info", { operationId });
    const record = await db
      .insert(documentsTable)
      .values({ userId, s3Url, fileName: file.name })
      .returning();
    trackTrace("Database record created", "info", {
      operationId,
      documentId: record[0].id,
    });

    // Step 3: Queue for processing
    trackTrace("Queuing for processing", "info", { operationId });
    await queueForProcessing(record[0].id);
    trackTrace("Queued successfully", "info", { operationId });

    // Track business event
    trackServerEvent("document:uploaded", {
      documentId: record[0].id,
      userId,
      fileSize: file.size,
    });

    return { success: true, documentId: record[0].id };
  } catch (error) {
    trackTrace("Document upload failed", "error", {
      operationId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Upload failed" };
  }
}
```

## Pattern 6: Conditional Logging

```typescript
"use server";

import { trackTrace, trackServerEvent } from "@/lib/telemetry-server";

export async function sendNotifications(
  newsId: string,
  excludedCustomers: string[],
) {
  const targetUsers = await getTargetUserIds(excludedCustomers);

  // Always log important operations
  trackTrace(`Preparing to send notifications`, "info", {
    newsId,
    targetUserCount: targetUsers.length,
    excludedCustomerCount: excludedCustomers.length,
  });

  // Warn if target is unusually large
  if (targetUsers.length > 1000) {
    trackTrace("Large notification batch detected", "warn", {
      newsId,
      targetUserCount: targetUsers.length,
    });
  }

  // Warn if no targets
  if (targetUsers.length === 0) {
    trackTrace("No target users for notification", "warn", {
      newsId,
      excludedCustomerCount: excludedCustomers.length,
    });
    return { success: false, error: "No targets" };
  }

  await sendBatchNotifications(newsId, targetUsers);

  // Track business metric
  trackServerEvent("notifications:sent", {
    newsId,
    recipientCount: targetUsers.length,
  });

  trackTrace("Notifications sent successfully", "info", {
    newsId,
    targetUserCount: targetUsers.length,
  });

  return { success: true, sentCount: targetUsers.length };
}
```

## Pattern 7: Performance Tracking

```typescript
"use server";

import { trackTrace, trackDatabaseQuery } from "@/lib/telemetry-server";

export async function complexDataOperation(userId: string) {
  const startTime = Date.now();

  trackTrace("Starting complex data operation", "info", { userId });

  try {
    // Track DB query performance
    const queryStart = Date.now();
    const data = await db.query.users.findMany({
      where: eq(users.id, userId),
      with: { licenses: true, courses: true },
    });
    const queryDuration = Date.now() - queryStart;

    trackDatabaseQuery("SELECT", "users", queryDuration, true, {
      userId,
      withRelations: true,
    });

    // Warn if slow
    if (queryDuration > 1000) {
      trackTrace("Slow query detected", "warn", {
        userId,
        duration: queryDuration,
        operation: "complexDataOperation",
      });
    }

    const totalDuration = Date.now() - startTime;
    trackTrace("Complex data operation complete", "info", {
      userId,
      totalDuration,
      queryDuration,
    });

    return { success: true, data };
  } catch (error) {
    const duration = Date.now() - startTime;
    trackTrace("Complex data operation failed", "error", {
      userId,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

## Pattern 8: Auth Events

```typescript
"use server";

import { trackAuthEvent, trackTrace } from "@/lib/telemetry-server";

export async function loginUser(username: string, password: string) {
  trackTrace("Login attempt", "info", { username });

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      trackAuthEvent("login", username, false, {
        reason: "invalid_credentials",
      });
      trackTrace("Login failed - invalid credentials", "warn", { username });
      return { success: false, error: "Invalid credentials" };
    }

    trackAuthEvent("login", user.id, true, { username, method: "password" });
    trackTrace("Login successful", "info", { userId: user.id, username });

    return { success: true, user };
  } catch (error) {
    trackAuthEvent("login", username, false, { reason: "error" });
    trackTrace("Login error", "error", {
      username,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Login failed" };
  }
}
```

## Quick Tips

### When to use trackTrace vs trackServerEvent

**Use `trackTrace()`:**

- General logging
- Operation status updates
- Debugging information
- Error messages

**Use `trackServerEvent()`:**

- Business metrics
- User actions
- Important milestones
- Analytics data

### Properties Best Practices

```typescript
// ✅ GOOD - Structured, queryable properties
trackTrace("User action", "info", {
  userId: "123",
  action: "profile_update",
  fieldsChanged: 3,
  duration: 234,
});

// ❌ BAD - Everything in message, not queryable
trackTrace("User 123 updated profile, changed 3 fields in 234ms", "info");
```

### Error Handling

```typescript
// ✅ GOOD - Track exception + trace
try {
  await operation();
} catch (error) {
  if (error instanceof Error) {
    trackServerException(error, { context: "operation" });
  }
  trackTrace("Operation failed", "error", {
    error: error instanceof Error ? error.message : String(error),
  });
  return { success: false, error: "Failed" };
}

// ❌ BAD - Silent failure
try {
  await operation();
} catch (error) {
  return { success: false };
}
```

## Summary

1. **Start of operation**: Log with context
2. **Success**: Log outcome with metrics
3. **Failure**: Log error with details
4. **Business events**: Track for analytics
5. **Performance**: Warn on slow operations
6. **Exceptions**: Always track with context
