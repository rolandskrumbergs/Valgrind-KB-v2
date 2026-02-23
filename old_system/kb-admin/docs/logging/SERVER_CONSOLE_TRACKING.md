# Server-Side Console Tracking

## Overview

Server-side console tracking is **automatically enabled** when Application Insights is initialized via OpenTelemetry. All console statements (`log`, `info`, `warn`, `error`, `debug`) from **server actions**, **API routes**, and **server components** are captured and sent to Azure Application Insights.

## How It Works

The console tracking is initialized in `instrumentation.node.ts` and:

1. Intercepts native console methods (log, info, warn, error, debug)
2. Logs the message to the terminal console as normal
3. Sends the message to Application Insights as a trace via OpenTelemetry Logs API
4. Preserves the severity level and context information

## Console Methods Mapping

| Console Method    | Severity Number | Severity Text | Application Insights |
| ----------------- | --------------- | ------------- | -------------------- |
| `console.debug()` | 5               | DEBUG         | Trace (Verbose)      |
| `console.log()`   | 9               | INFO          | Trace (Information)  |
| `console.info()`  | 9               | INFO          | Trace (Information)  |
| `console.warn()`  | 13              | WARN          | Trace (Warning)      |
| `console.error()` | 17              | ERROR         | Trace (Error)        |

## Usage Examples

### In Server Actions

```typescript
"use server";

export async function updateNewsStatusAction(id: string, status: string) {
  // This will appear in Application Insights
  console.log(`Updating news ${id} to status ${status}`);

  try {
    const result = await updateNews(id, status);
    console.log(`Successfully updated news ${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update news:", error);
    return { error: "Update failed" };
  }
}
```

### In API Routes

```typescript
// app/api/my-route/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("API route called");

  const data = await req.json();
  console.info("Received data:", data);

  if (!data.valid) {
    console.warn("Invalid data received");
    return Response.json({ error: "Invalid" }, { status: 400 });
  }

  console.log("Processing complete");
  return Response.json({ success: true });
}
```

### In Server Components

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  console.log("Rendering dashboard page");

  const data = await fetchData();
  console.info(`Fetched ${data.length} items`);

  return <div>{/* ... */}</div>;
}
```

### Complex Objects

```typescript
// Objects are automatically stringified
const user = { id: "123", name: "John" };
console.log("User logged in:", user);
// Appears as: "User logged in: {"id":"123","name":"John"}"

// Arrays work too
const items = [1, 2, 3];
console.info("Items:", items);
// Appears as: "Items: [1,2,3]"
```

## Viewing Console Logs in Azure Portal

### Navigate to Traces

1. Open your Application Insights resource
2. Go to **Logs** section
3. Query the `traces` table

### Example KQL Queries

**Get all server console logs:**

```kusto
traces
| where customDimensions.["console.method"] != ""
| order by timestamp desc
| take 100
```

**Get only console.log statements:**

```kusto
traces
| where customDimensions.["console.method"] == "log"
| project timestamp, message, severityLevel
| order by timestamp desc
```

**Get errors from console.error:**

```kusto
traces
| where customDimensions.["console.method"] == "error"
| where timestamp > ago(1h)
| order by timestamp desc
```

**Get warnings:**

```kusto
traces
| where customDimensions.["console.method"] == "warn"
| project timestamp, message
| order by timestamp desc
```

**Search logs by content:**

```kusto
traces
| where message contains "news"
| where customDimensions.["console.method"] in ("log", "info")
| order by timestamp desc
| take 50
```

**Count logs by method:**

```kusto
traces
| where customDimensions.["console.method"] != ""
| summarize count() by method = tostring(customDimensions.["console.method"])
| render piechart
```

**Get logs from specific server action:**

```kusto
traces
| where message contains "Sending notifications"
| project timestamp, message, severityLevel
| order by timestamp desc
```

## Technical Implementation

### Location

Console tracking is set up in:

- `instrumentation.node.ts` - Main setup and interception

### Key Components

1. **Original Console Methods** - Stored to preserve native behavior
2. **OpenTelemetry Logs API** - Used to emit log records
3. **Format Function** - Converts arguments to strings (handles objects, errors, etc.)

### Architecture

```
console.log("message")
       ↓
Intercepted by instrumentation.node.ts
       ↓
1. Call original console.log (appears in terminal)
2. Format arguments to string
3. Create log record with severityNumber & attributes
4. Emit via OpenTelemetry Logs API
       ↓
Azure Monitor Exporter
       ↓
Application Insights (traces table)
```

## Best Practices

### ✅ Do

- Use appropriate log levels:
  - `console.log()` or `console.info()` for informational messages
  - `console.warn()` for warnings
  - `console.error()` for errors
  - `console.debug()` for verbose debugging (may be filtered in production)
- Add context to your logs:
  ```typescript
  console.log(`[AUTH] User ${userId} logged in`);
  console.log(`[NEWS] Publishing article ${articleId}`);
  ```
- Log structured data:
  ```typescript
  console.log("Event details:", { type, timestamp, userId });
  ```
- Log errors with Error objects:
  ```typescript
  console.error("Operation failed:", new Error("reason"));
  ```

### ❌ Don't

- Don't log sensitive data (passwords, tokens, PII, credit cards, API keys)
- Don't log excessively in tight loops (causes high telemetry volume & costs)
- Don't log huge objects (can hit size limits and affect performance)
- Don't rely solely on console logs for critical errors - use `trackServerException()` for important exceptions

### Security Considerations

```typescript
// ❌ BAD - Logs sensitive data
console.log("Login attempt:", { username, password });

// ✅ GOOD - Redacts sensitive info
console.log("Login attempt:", { username, passwordProvided: !!password });

// ❌ BAD - Logs API key
console.log("API response:", response);

// ✅ GOOD - Logs without sensitive headers
console.log("API response status:", response.status);
```

## Production Considerations

### Option 1: Use trackServerEvent for Important Events

For critical business events, use the dedicated telemetry functions instead of console.log:

```typescript
import { trackServerEvent } from "@/lib/telemetry-server";

// Better for important events
trackServerEvent("news:published", {
  newsId: id,
  targetUsers: targetUserIds.length,
});

// Instead of
console.log(`Sending notifications to ${targetUserIds.length} users`);
```

### Option 2: Conditional Logging

```typescript
// Only log in development
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}

// Or create a helper
function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}
```

### Option 3: Environment-Based Filtering

You can disable console tracking by setting:

```env
DISABLE_TELEMETRY=true
```

## Performance Impact

- **Minimal** - Console interception adds negligible overhead
- **Async** - Telemetry is sent asynchronously, doesn't block execution
- **Sampling** - Currently set to 100% but can be adjusted in `instrumentation.node.ts`

## Troubleshooting

### Console logs not appearing?

1. **Check connection string:**
   ```bash
   echo $env:APPLICATIONINSIGHTS_CONNECTION_STRING
   ```
2. **Restart dev server** after changes to instrumentation files:
   ```bash
   pnpm dev
   ```
3. **Check Application Insights** - It may take 1-2 minutes for logs to appear
4. **Verify query** - Make sure you're querying the `traces` table with correct filters

### Too many logs?

If you're seeing too many logs in Application Insights:

1. Use conditional logging (see Production Considerations above)
2. Adjust sampling ratio in `instrumentation.node.ts`:
   ```typescript
   samplingRatio: 0.5, // Track 50% of logs
   ```
3. Use dedicated telemetry functions for important events only

## Related Documentation

- [Console Tracking (Client-Side)](./CONSOLE_TRACKING.md)
- [Console Filter Guide (Client-Side)](./CONSOLE_FILTER_GUIDE.md)
- [Server Telemetry](./SERVER_TELEMETRY.md)
- [Application Insights Setup](./APPLICATION_INSIGHTS_SETUP.md)

## Example: Your News Actions

Your news action with console.log will now work:

```typescript
export async function updateNewsStatusAction(id: string, status: string) {
  // ... code ...

  // ✅ This will now appear in Application Insights traces table
  console.log(
    `Sending notifications to ${targetUserIds.length} users for news: ${result.data.id}`,
  );

  // ... code ...
}
```

Query to find it:

```kusto
traces
| where message contains "Sending notifications"
| project timestamp, message
| order by timestamp desc
```

## Summary

- ✅ **Automatic** - All server-side console methods are tracked
- ✅ **Zero config** - Works out of the box after initialization
- ✅ **Preserved behavior** - Console still works normally in terminal
- ✅ **Flexible** - Use console.log for debugging, dedicated functions for critical events
- ✅ **Query-able** - Find logs using KQL queries in Application Insights
