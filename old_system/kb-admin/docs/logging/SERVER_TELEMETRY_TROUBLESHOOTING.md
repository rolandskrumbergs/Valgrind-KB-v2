# Server-Side Telemetry Troubleshooting Guide

## The Problem

When using `trackServerEvent()` and `trackServerException()`, the events and exceptions don't appear in the expected locations in Application Insights.

## Why This Happens

**OpenTelemetry uses a different data model than classic Application Insights:**

| Classic App Insights                 | OpenTelemetry/Azure Monitor              |
| ------------------------------------ | ---------------------------------------- |
| Custom Events → `customEvents` table | Traces/Logs → `traces` table             |
| Exceptions → `exceptions` table      | Exceptions on spans → `exceptions` table |
| Metrics → `customMetrics` table      | Metrics → `customMetrics` table          |

OpenTelemetry primarily focuses on **distributed tracing** (spans/requests/dependencies), not custom events. When you track a custom event, it becomes a **trace** (log entry) in Application Insights.

## The Solution

### Understanding Where Your Data Goes

#### 1. Custom Events (`trackServerEvent`)

**Shows up as:** Traces in the `traces` table  
**Severity Level:** Information (1)

**To find them:**

```kusto
// Application Insights > Logs > traces
traces
| where message contains "CustomEvent:"
| where severityLevel == 1
| project timestamp, message, customDimensions
| order by timestamp desc
```

#### 2. Exceptions (`trackServerException`)

**Shows up as:** Exceptions in the `exceptions` table  
**Also as:** Error traces in the `traces` table

**To find them:**

```kusto
// Application Insights > Logs > exceptions
exceptions
| where type != ""
| project timestamp, type, outerMessage, details, customDimensions
| order by timestamp desc

// Or in Failures tab
// Application Insights > Failures > Exceptions
```

#### 3. Metrics (`trackServerMetric`)

**Shows up as:** Traces with metric information

**To find them:**

```kusto
// Application Insights > Logs > traces
traces
| where message contains "metric:"
| project timestamp, message, customDimensions
| order by timestamp desc
```

## Testing Your Telemetry

### Use the Test API Endpoint

A test API route has been created at `/api/telemetry-test`:

```bash
# Test custom event
curl http://localhost:3000/api/telemetry-test?action=event

# Test exception
curl http://localhost:3000/api/telemetry-test?action=exception

# Test metric
curl http://localhost:3000/api/telemetry-test?action=metric

# Test all at once
curl http://localhost:3000/api/telemetry-test?action=all

# POST custom event
curl -X POST http://localhost:3000/api/telemetry-test \
  -H "Content-Type: application/json" \
  -d '{"eventName": "MyCustomEvent", "properties": {"userId": "123", "action": "test"}}'
```

### Verification Steps

1. **Call the test endpoint**

   ```bash
   curl http://localhost:3000/api/telemetry-test?action=all
   ```

2. **Wait 2-3 minutes** for data to appear in Application Insights

3. **Check Application Insights**:
   - Go to Azure Portal → Your Application Insights resource
   - Navigate to **Logs** (left menu)
   - Run the queries below

### Query Examples

#### Find Custom Events

```kusto
traces
| where message contains "CustomEvent:"
| where timestamp > ago(1h)
| project
    timestamp,
    message,
    event_name = tostring(customDimensions.event_name),
    event_type = tostring(customDimensions.event_type),
    customDimensions
| order by timestamp desc
```

#### Find Exceptions

```kusto
exceptions
| where timestamp > ago(1h)
| project
    timestamp,
    type,
    outerMessage,
    details,
    customDimensions
| order by timestamp desc
```

#### Find Test Telemetry

```kusto
traces
| where customDimensions.source == "telemetry-test-api"
| where timestamp > ago(1h)
| project timestamp, message, severityText, customDimensions
| order by timestamp desc
```

## Updated Implementation

The `telemetry-server.ts` has been updated to:

1. **Use OpenTelemetry Logs API** - Emits log records that appear as traces
2. **Create spans with events** - Provides distributed tracing context
3. **Record exceptions properly** - Uses `span.recordException()` for exceptions table
4. **Add console logging** - Immediate feedback that telemetry was called

### Code Changes

```typescript
// Events now emit logs AND create spans
export function trackServerEvent(name: string, properties?: TelemetryProperties) {
  const logger = getLogger();
  const tracer = getTracer();

  // Emit log (appears in traces table)
  logger.emit({
    severityNumber: 9, // INFO
    severityText: "INFO",
    body: `CustomEvent: ${name}`,
    attributes: { "event.name": name, ...properties }
  });

  // Create span for tracing context
  const span = tracer.startSpan(`Event: ${name}`, { ... });
  span.addEvent(name, properties);
  span.end();

  // Console log for debugging
  console.log(`[Telemetry] Event tracked: ${name}`, properties);
}
```

## Problem 4: Exceptions Not Appearing in Exceptions Table

### Symptom

- Exceptions are tracked but don't appear in Application Insights exceptions table
- Exceptions only visible in traces table as ERROR logs
- No entries in Failures > Exceptions view

### Root Cause

Exceptions must be recorded on spans with `SpanKind.SERVER` to populate the exceptions table. Using `SpanKind.INTERNAL` or other span kinds won't work properly with Azure Monitor's exception mapping.

### Solution

The `trackServerException()` function has been updated to:

1. **Check for active request span first**: If called within an HTTP request handler, it uses the active span
2. **Create SERVER span as fallback**: If no active span exists, creates a `SpanKind.SERVER` span

#### Updated Implementation (in `telemetry-server.ts`)

```typescript
export function trackServerException(
  error: Error,
  properties?: TelemetryProperties,
) {
  const logger = getLogger();

  // Always log to traces table
  logger.emit({
    severityNumber: 17,
    severityText: "ERROR",
    body: `${error.name}: ${error.message}`,
    attributes: {
      "exception.type": error.name,
      "exception.message": error.message,
      "exception.stacktrace": error.stack || "",
      ...properties,
    },
  });

  // Check for active request span
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    // Use the active request span (best approach)
    activeSpan.recordException(error);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    if (properties) {
      activeSpan.setAttributes(properties);
    }
  } else {
    // Create SERVER span for proper exception tracking
    const tracer = getTracer();
    const span = tracer.startSpan(`Exception: ${error.name}`, {
      kind: SpanKind.SERVER, // Critical: must be SERVER
      attributes: {
        "exception.type": error.name,
        "exception.message": error.message,
        "exception.escaped": "true",
        ...properties,
      },
    });

    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    span.end();
  }
}
```

### Verification

Query the exceptions table:

```kql
exceptions
| where timestamp > ago(1h)
| order by timestamp desc
| project timestamp, type, outerMessage, problemId, customDimensions
```

Exceptions should now appear with proper type, message, and custom properties.

### Key Points

- ✅ **SpanKind.SERVER** is required for exceptions table population
- ✅ Recording on active request span works best in API routes
- ✅ Fallback SERVER span ensures exceptions are always tracked
- ✅ Exceptions appear in both exceptions and traces tables
- ⏱️ Wait 2-5 minutes for data to appear in Application Insights

See `SERVER_EXCEPTION_TRACKING_FIX.md` for detailed explanation.

---

### Issue 1: No Data Appearing

**Symptoms:** No telemetry showing up in Application Insights

**Checklist:**

- ✅ Is `APPLICATIONINSIGHTS_CONNECTION_STRING` set in `.env`?
- ✅ Did you restart the dev server after adding the connection string?
- ✅ Did you wait 2-3 minutes for data to appear?
- ✅ Is the connection string correct and pointing to the right resource?
- ✅ Check the console for `"✅ Azure Monitor OpenTelemetry initialized successfully"`

**Solution:**

```bash
# Verify environment variable is set
echo $env:APPLICATIONINSIGHTS_CONNECTION_STRING

# Restart dev server
pnpm dev
```

### Issue 2: Data in Wrong Location

**Symptoms:** Can't find events in `customEvents` table

**Reason:** OpenTelemetry doesn't use `customEvents` table

**Solution:** Look in the `traces` table instead:

```kusto
traces
| where message contains "CustomEvent:"
| where timestamp > ago(1h)
```

### Issue 3: Exceptions Not Showing

**Symptoms:** `trackServerException()` called but no exceptions visible

**Reason:** May need to check both `exceptions` and `traces` tables

**Solution:**

```kusto
// Check exceptions table
exceptions
| where timestamp > ago(1h)
| order by timestamp desc

// Also check traces for error logs
traces
| where severityLevel >= 3  // Error or Critical
| where timestamp > ago(1h)
| order by timestamp desc
```

### Issue 4: Logs Disabled

**Symptoms:** Events tracked but not appearing anywhere

**Reason:** Logging instrumentation not properly initialized

**Solution:** The `instrumentation.node.ts` has been updated to enable logging:

```typescript
useAzureMonitor({
  enableTraceBasedSamplingForLogs: false, // Capture all logs
  instrumentationOptions: {
    bunyan: { enabled: false },
    winston: { enabled: false },
  },
});
```

## Best Practices

### 1. Use Consistent Naming

```typescript
// Good - clear, descriptive names
trackServerEvent("UserLoggedIn", { userId: "123", method: "password" });
trackServerEvent("OrderCompleted", { orderId: "456", amount: 99.99 });

// Avoid - vague names
trackServerEvent("event1", { data: "something" });
```

### 2. Include Contextual Properties

```typescript
trackServerEvent("PaymentProcessed", {
  userId: user.id,
  orderId: order.id,
  amount: payment.amount,
  currency: "USD",
  paymentMethod: "credit_card",
  timestamp: new Date().toISOString(),
});
```

### 3. Use Proper Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    // Track with context
    trackServerException(error, {
      operation: "riskyOperation",
      userId: user.id,
      context: "payment-processing",
    });
  }
  // Re-throw or handle
  throw error;
}
```

### 4. Monitor Console Output

The updated functions log to console for immediate feedback:

```
[Telemetry] Event tracked: UserLoggedIn { userId: '123' }
[Telemetry] Exception tracked: ValidationError: Invalid input { ... }
```

## Query Cheat Sheet

### Find All Telemetry from Your App

```kusto
union traces, exceptions, requests, dependencies
| where timestamp > ago(1h)
| where cloud_RoleName contains "kb-admin"
| project timestamp, itemType, message, customDimensions
| order by timestamp desc
```

### Find Custom Events

```kusto
traces
| where message contains "CustomEvent:"
| extend event_name = tostring(customDimensions.event_name)
| summarize count() by event_name
| order by count_ desc
```

### Find Exceptions by Type

```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by type
| order by count_ desc
```

### Performance of Server Actions

```kusto
requests
| where name contains "server-action:"
| summarize
    count(),
    avg(duration),
    percentile(duration, 95)
  by name
| order by avg_duration desc
```

## Files Modified

| File                                  | Changes                                           |
| ------------------------------------- | ------------------------------------------------- |
| `src/lib/telemetry-server.ts`         | Added logs API, improved event/exception tracking |
| `instrumentation.node.ts`             | Configured logging options                        |
| `src/app/api/telemetry-test/route.ts` | **NEW** - Test endpoint                           |
| `SERVER_TELEMETRY_TROUBLESHOOTING.md` | **NEW** - This guide                              |

## Need Help?

### Check Initialization

Look for this in your console when the server starts:

```
✅ Azure Monitor OpenTelemetry initialized successfully
ℹ️  Custom events will appear in Application Insights > Logs > traces table
ℹ️  Exceptions will appear in Application Insights > Failures > Exceptions
```

### Verify Connection String

```bash
# Development
echo $env:APPLICATIONINSIGHTS_CONNECTION_STRING

# Should output something like:
# InstrumentationKey=xxx;IngestionEndpoint=https://...
```

### Test Manually

```bash
# Hit the test endpoint
curl http://localhost:3000/api/telemetry-test?action=all

# Check console output
# Should see: [Telemetry] Event tracked: TestAllEvent { ... }
```

## Summary

✅ **Custom events** → `traces` table (look for messages containing "CustomEvent:")  
✅ **Exceptions** → `exceptions` table (also in Failures tab)  
✅ **Metrics** → `traces` table with metric information  
✅ **All telemetry** works - just look in the right places!  
✅ **Test endpoint** available at `/api/telemetry-test`

The telemetry **is working** - it just appears in different tables than you might expect from classic Application Insights SDK! 🎉
