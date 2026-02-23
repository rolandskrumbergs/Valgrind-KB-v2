# Console Tracking - Quick Reference

## Overview

Console tracking is **automatically enabled** when Application Insights is initialized. All console statements (`log`, `info`, `warn`, `error`, `debug`) are captured and sent to Azure Application Insights.

## How It Works

The console tracking feature intercepts the native console methods and:

1. Logs the message to the browser console as normal
2. Sends the message to Application Insights as a trace or exception
3. Preserves stack traces and context information

## Console Methods Mapping

| Console Method    | Application Insights Level | Severity Level |
| ----------------- | -------------------------- | -------------- |
| `console.log()`   | Trace (Information)        | 1              |
| `console.info()`  | Trace (Information)        | 1              |
| `console.warn()`  | Trace (Warning)            | 2              |
| `console.error()` | Trace (Error) or Exception | 3              |
| `console.debug()` | Trace (Verbose)            | 0              |

## Usage Examples

### Basic Usage (Automatic)

```typescript
// These are automatically tracked - no changes needed!
console.log("User logged in");
console.warn("API response slow");
console.error("Failed to save data");
console.info("Processing complete");
console.debug("State:", { count: 5 });
```

### Disable/Enable Tracking

```typescript
import {
  disableConsoleTracking,
  enableConsoleTracking,
} from "@/lib/application-insights";

// Disable tracking
disableConsoleTracking();
console.log("This won't be tracked");

// Re-enable tracking
enableConsoleTracking();
console.log("This will be tracked");
```

### Manual Trace Tracking

```typescript
import { trackTrace } from "@/lib/application-insights";

// Manually send a trace without using console
trackTrace("info", "Manual trace message", [{ additionalData: "value" }]);
```

## Viewing Console Logs in Azure Portal

### Navigate to Traces

1. Open your Application Insights resource
2. Go to **Logs** section
3. Query the `traces` table

### Example KQL Queries

**Get all console logs:**

```kusto
traces
| where customDimensions.consoleMethod != ""
| order by timestamp desc
```

**Get only errors:**

```kusto
traces
| where customDimensions.consoleMethod == "error"
| project timestamp, message, severityLevel
```

**Get warnings from last hour:**

```kusto
traces
| where timestamp > ago(1h)
| where customDimensions.consoleMethod == "warn"
| order by timestamp desc
```

**Count logs by type:**

```kusto
traces
| where customDimensions.consoleMethod != ""
| summarize count() by consoleMethod = tostring(customDimensions.consoleMethod)
| render piechart
```

**Search logs by content:**

```kusto
traces
| where message contains "user"
| where customDimensions.consoleMethod in ("log", "info")
| take 100
```

## Best Practices

### ✅ Do

- Use appropriate log levels (info for information, warn for warnings, error for errors)
- Add context to your logs: `console.log("[AUTH]", "User login", { userId })`
- Log structured data: `console.log("Event", { type, timestamp, userId })`
- Log errors with Error objects: `console.error("Failed", new Error("reason"))`

### ❌ Don't

- Don't log sensitive data (passwords, tokens, PII, credit cards)
- Don't log excessively in tight loops (causes high telemetry volume)
- Don't log large objects (can hit size limits)
- Don't rely solely on console logs for critical monitoring (use trackException for errors)

## Production Considerations

### Option 1: Track Only Warnings and Errors

```typescript
// In your initialization code
if (process.env.NODE_ENV === "production") {
  disableConsoleTracking();

  // Manually track only warn and error
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    originalWarn(...args);
    trackTrace("warn", args.join(" "));
  };

  console.error = (...args) => {
    originalError(...args);
    trackTrace("error", args.join(" "));
  };
} else {
  // Track everything in development
  enableConsoleTracking();
}
```

### Option 2: Use Log Level Filtering

```typescript
// Add a wrapper to filter logs
export function setupProductionLogging() {
  const isDev = process.env.NODE_ENV === "development";

  // Store originals
  const originalLog = console.log;
  const originalDebug = console.debug;

  // Override in production
  if (!isDev) {
    console.log = () => {}; // Disable in production
    console.debug = () => {}; // Disable in production
  }
}
```

### Option 3: Sampling

```typescript
// Sample console logs (only track 10%)
let logCount = 0;
const SAMPLE_RATE = 0.1;

console.log = (...args) => {
  originalConsole.log(...args);

  if (Math.random() < SAMPLE_RATE) {
    trackTrace("log", args.join(" "));
  }
};
```

## Cost Management

Console tracking can increase telemetry volume. To manage costs:

1. **Filter in production**: Only track warnings and errors
2. **Use sampling**: Track a percentage of logs instead of all
3. **Set up alerts**: Monitor telemetry volume in Azure
4. **Use daily caps**: Configure Application Insights daily data caps
5. **Review regularly**: Check which logs are most frequent and useful

## Troubleshooting

### Console logs not appearing in Application Insights

1. **Check connection string**: Ensure `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` is set
2. **Verify initialization**: Console tracking is enabled in `initializeAppInsights()`
3. **Check timing**: Logs before initialization aren't tracked
4. **Wait for ingestion**: Can take 2-3 minutes to appear in Azure Portal
5. **Check browser console**: Look for Application Insights errors

### Too many console logs being tracked

```typescript
// Solution 1: Disable tracking for specific components
disableConsoleTracking();

// Solution 2: Add filtering logic
const shouldTrack = (level: string, message: string) => {
  // Don't track debug logs
  if (level === "debug") return false;

  // Don't track frequent health checks
  if (message.includes("health check")) return false;

  return true;
};
```

### Console tracking causing performance issues

This is rare, but if you experience issues:

```typescript
// Disable console tracking
disableConsoleTracking();

// Use manual tracking for important events only
import { trackException, trackEvent } from "@/lib/application-insights";

try {
  // Your code
} catch (error) {
  trackException(error); // Only track actual errors
}
```

## API Reference

### `enableConsoleTracking()`

Enables automatic console tracking. Called automatically during initialization.

### `disableConsoleTracking()`

Disables automatic console tracking and restores original console methods.

### `trackTrace(level, message, args?)`

Manually track a trace message.

**Parameters:**

- `level`: "log" | "info" | "warn" | "error" | "debug"
- `message`: string - The trace message
- `args?`: unknown[] - Additional arguments (optional)

## Related Documentation

- [Application Insights Setup](./APPLICATION_INSIGHTS_SETUP.md)
- [Console Examples](./src/lib/application-insights-console-examples.ts)
- [Azure Application Insights Docs](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
