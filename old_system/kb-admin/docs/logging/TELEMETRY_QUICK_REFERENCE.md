# Server Telemetry - Quick Reference Guide

## Available Functions

All functions are exported from `@/lib/telemetry-server`.

### 1. **trackTrace** - Simple Logging (Recommended for most cases)

Use this as a direct replacement for console.log that ensures data reaches Application Insights.

```typescript
import { trackTrace } from "@/lib/telemetry-server";

// Info level (default)
trackTrace("User logged in successfully");
trackTrace("Processing completed", "info", { userId: "123", duration: 45 });

// Warning level
trackTrace("API rate limit approaching", "warn", {
  endpoint: "/api/chat",
  remaining: 5,
});

// Error level
trackTrace("Database connection failed", "error", {
  database: "postgres",
  attempts: 3,
});

// Debug level
trackTrace("Cache hit", "debug", { key: "user:123", ttl: 300 });
```

**Appears in Application Insights:**

- Table: `traces`
- Query:
  ```kusto
  traces
  | where customDimensions.["trace.level"] != ""
  | order by timestamp desc
  ```

### 2. **trackServerEvent** - Custom Business Events

Use for important business events you want to track and analyze.

```typescript
import { trackServerEvent } from "@/lib/telemetry-server";

trackServerEvent("news:published", {
  newsId: "123",
  targetUsers: 150,
  hasImage: true,
});

trackServerEvent("user:registration", {
  userId: "456",
  source: "mobile",
  plan: "premium",
});

trackServerEvent("payment:completed", {
  userId: "789",
  amount: 99.99,
  currency: "USD",
});
```

**Appears in Application Insights:**

- Table: `traces` and `dependencies`
- Query:
  ```kusto
  traces
  | where customDimensions.["event.name"] != ""
  | project timestamp, message, customDimensions
  | order by timestamp desc
  ```

### 3. **trackServerException** - Error Tracking

Use for catching and tracking exceptions.

```typescript
import { trackServerException } from "@/lib/telemetry-server";

try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    trackServerException(error, {
      operation: "riskyOperation",
      userId: "123",
    });
  }
  throw error; // Re-throw if needed
}
```

**Appears in Application Insights:**

- Table: `exceptions` and `traces`
- Portal: **Failures > Exceptions**
- Query:
  ```kusto
  exceptions
  | order by timestamp desc
  ```

### 4. **trackBusinessEvent** - Business Metrics

Shorthand for business-specific events (prefixes with "business:").

```typescript
import { trackBusinessEvent } from "@/lib/telemetry-server";

trackBusinessEvent("course:completed", {
  courseId: "101",
  userId: "123",
  score: 95,
});

trackBusinessEvent("license:expired", {
  customerId: "456",
  licenseCount: 10,
});
```

### 5. **trackAuthEvent** - Authentication Events

Track authentication-related events.

```typescript
import { trackAuthEvent } from "@/lib/telemetry-server";

trackAuthEvent("login", userId, true, { source: "mobile" });
trackAuthEvent("logout", userId, true);
trackAuthEvent("signup", userId, true, { plan: "free" });
trackAuthEvent("password-reset", userId, true);
```

### 6. **trackDatabaseQuery** - Database Performance

Track database query performance.

```typescript
import { trackDatabaseQuery } from "@/lib/telemetry-server";

const startTime = Date.now();
try {
  const result = await db.select().from(users);
  const duration = Date.now() - startTime;
  trackDatabaseQuery("SELECT", "users", duration, true);
} catch (error) {
  const duration = Date.now() - startTime;
  trackDatabaseQuery("SELECT", "users", duration, false);
}
```

### 7. **trackApiCall** - External API Tracking

Track calls to external APIs.

```typescript
import { trackApiCall } from "@/lib/telemetry-server";

const startTime = Date.now();
const response = await fetch("https://api.example.com/data");
const duration = Date.now() - startTime;

trackApiCall(
  "GET",
  "https://api.example.com/data",
  duration,
  response.status,
  response.ok,
);
```

### 8. **withTelemetry** - Wrap Server Actions

Automatically track server action execution.

```typescript
import { withTelemetry } from "@/lib/telemetry-server";

export const myAction = withTelemetry("myAction", async (input: string) => {
  // Your logic here
  return { success: true };
});

// Automatically tracks:
// - Action name
// - Duration
// - Success/failure
// - Exceptions
```

### 9. **withServerSpan** - Custom Operation Tracking

Track a custom operation with a span.

```typescript
import { withServerSpan } from "@/lib/telemetry-server";

const result = await withServerSpan(
  "complex-operation",
  async (span) => {
    span.setAttribute("input.size", data.length);
    const result = await processData(data);
    span.setAttribute("output.size", result.length);
    return result;
  },
  { operation: "data-processing" },
);
```

## Migration Examples

### From console.log to trackTrace

**Before:**

```typescript
console.log(`Processing ${count} items`);
console.warn("API limit reached");
console.error("Database error:", error);
```

**After:**

```typescript
import { trackTrace } from "@/lib/telemetry-server";

trackTrace(`Processing ${count} items`, "info", { count });
trackTrace("API limit reached", "warn", { endpoint: "/api/data" });
trackTrace("Database error", "error", { error: error.message });
```

### From console.log to trackServerEvent

**Before:**

```typescript
console.log("User completed course");
console.log("Payment processed");
```

**After:**

```typescript
import { trackServerEvent } from "@/lib/telemetry-server";

trackServerEvent("course:completed", {
  userId: "123",
  courseId: "101",
  completedAt: new Date().toISOString(),
});

trackServerEvent("payment:processed", {
  userId: "123",
  amount: 99.99,
  paymentMethod: "credit_card",
});
```

## Viewing in Application Insights

### Quick Queries

**All traces:**

```kusto
traces
| order by timestamp desc
| take 100
```

**Custom traces only:**

```kusto
traces
| where customDimensions.["trace.level"] != ""
| project timestamp, message, severityLevel, customDimensions
| order by timestamp desc
```

**Errors only:**

```kusto
traces
| where customDimensions.["trace.level"] == "error"
| order by timestamp desc
```

**Business events:**

```kusto
traces
| where customDimensions.["event.name"] != ""
| project timestamp, event = customDimensions.["event.name"], customDimensions
| order by timestamp desc
```

**Exceptions:**

```kusto
exceptions
| order by timestamp desc
| take 50
```

**Search by property:**

```kusto
traces
| where customDimensions.newsId == "123"
| order by timestamp desc
```

## Best Practices

### ✅ DO

1. **Use trackTrace for informational logs:**

   ```typescript
   trackTrace("News published successfully", "info", {
     newsId,
     targetUsers: count,
   });
   ```

2. **Include context properties:**

   ```typescript
   trackTrace("Operation completed", "info", {
     userId: "123",
     operation: "updateProfile",
     duration: 234,
   });
   ```

3. **Use appropriate levels:**

   - `info` - Normal operations
   - `warn` - Warnings, degraded performance
   - `error` - Errors, failures
   - `debug` - Detailed debugging info

4. **Track business-critical events:**
   ```typescript
   trackServerEvent("subscription:upgraded", {
     userId,
     fromPlan: "free",
     toPlan: "premium",
   });
   ```

### ❌ DON'T

1. **Don't log sensitive data:**

   ```typescript
   // ❌ BAD
   trackTrace("User login", "info", { password: "secret123" });

   // ✅ GOOD
   trackTrace("User login", "info", { userId: "123", success: true });
   ```

2. **Don't log in tight loops:**

   ```typescript
   // ❌ BAD
   for (let i = 0; i < 10000; i++) {
     trackTrace(`Processing item ${i}`, "info");
   }

   // ✅ GOOD
   trackTrace(`Processing ${items.length} items`, "info", {
     count: items.length,
   });
   // Process items...
   trackTrace("Processing complete", "info", { processed: items.length });
   ```

3. **Don't ignore errors:**

   ```typescript
   // ❌ BAD
   try {
     await operation();
   } catch (error) {
     // Silent failure
   }

   // ✅ GOOD
   try {
     await operation();
   } catch (error) {
     trackServerException(error, { operation: "myOperation" });
     throw error;
   }
   ```

## Performance Considerations

- **Async**: All tracking is non-blocking
- **Minimal overhead**: ~1-2ms per call
- **Batching**: OpenTelemetry batches data automatically
- **Sampling**: Can be configured in `instrumentation.node.ts`

## Environment Variables

- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Required for telemetry
- `DISABLE_TELEMETRY=true` - Disable all telemetry

## Summary

| Use Case        | Function                 | Example                                           |
| --------------- | ------------------------ | ------------------------------------------------- |
| Simple logging  | `trackTrace()`           | `trackTrace("User action", "info", {userId})`     |
| Business events | `trackServerEvent()`     | `trackServerEvent("order:created", {orderId})`    |
| Errors          | `trackServerException()` | `trackServerException(error, {context})`          |
| Auth events     | `trackAuthEvent()`       | `trackAuthEvent("login", userId, true)`           |
| DB queries      | `trackDatabaseQuery()`   | `trackDatabaseQuery("SELECT", "users", 45, true)` |
| API calls       | `trackApiCall()`         | `trackApiCall("GET", url, 234, 200, true)`        |
| Wrap actions    | `withTelemetry()`        | `withTelemetry("myAction", async () => {})`       |

**Recommended:** Use `trackTrace()` for most logging needs - it's simple, flexible, and guarantees visibility in Application Insights.
