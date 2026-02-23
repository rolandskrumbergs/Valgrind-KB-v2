# Server-Side Telemetry Fix Summary

## ✅ Problem Solved!

Server-side events and exceptions are now properly tracked and **will appear in Application Insights**.

## The Core Issue

**OpenTelemetry ≠ Classic Application Insights SDK**

The Azure Monitor OpenTelemetry package uses a different data model:

- **Custom Events** don't go to `customEvents` table → They go to `traces` table
- **Exceptions** go to `exceptions` table (this works correctly)
- **Metrics** appear as traces with metric data

This is **by design** - OpenTelemetry focuses on distributed tracing and structured logging.

## What Was Fixed

### 1. Updated `telemetry-server.ts`

Added proper logging using OpenTelemetry Logs API:

```typescript
// Now uses BOTH logger and tracer
export function trackServerEvent(name: string, properties?: TelemetryProperties) {
  const logger = getLogger();  // ← NEW: Logs API
  const tracer = getTracer();

  // Emit log record (appears as trace in App Insights)
  logger.emit({
    severityNumber: 9,  // INFO level
    severityText: "INFO",
    body: `CustomEvent: ${name}`,
    attributes: { "event.name": name, ...properties }
  });

  // Also create span for distributed tracing
  const span = tracer.startSpan(`Event: ${name}`, { ... });
  span.addEvent(name, properties);
  span.end();

  // Console feedback
  console.log(`[Telemetry] Event tracked: ${name}`, properties);
}
```

### 2. Updated `instrumentation.node.ts`

Configured logging options properly:

```typescript
useAzureMonitor({
  enableTraceBasedSamplingForLogs: false, // Capture ALL logs
  // ... other options
});
```

### 3. Created Test Endpoint

New API route at `/api/telemetry-test` for easy testing:

```bash
# Test events
GET /api/telemetry-test?action=event

# Test exceptions
GET /api/telemetry-test?action=exception

# Test all
GET /api/telemetry-test?action=all
```

### 4. Added Comprehensive Documentation

- ✅ `SERVER_TELEMETRY_TROUBLESHOOTING.md` - Complete troubleshooting guide
- ✅ KQL query examples
- ✅ Where to find each type of telemetry
- ✅ Common issues and solutions

## How to Verify It's Working

### Step 1: Test the Endpoint

```bash
curl http://localhost:3000/api/telemetry-test?action=all
```

You should see console output:

```
[Telemetry] Event tracked: TestAllEvent { test_type: 'all', source: 'telemetry-test-api' }
[Telemetry] Exception tracked: TestAllException: Test exception for 'all' action { ... }
```

### Step 2: Wait 2-3 Minutes

Application Insights has a slight delay for data ingestion.

### Step 3: Check Application Insights

Go to **Azure Portal → Application Insights → Logs**

#### Find Custom Events:

```kusto
traces
| where message contains "CustomEvent:"
| where timestamp > ago(1h)
| project timestamp, message, customDimensions
| order by timestamp desc
```

#### Find Exceptions:

```kusto
exceptions
| where timestamp > ago(1h)
| project timestamp, type, outerMessage, customDimensions
| order by timestamp desc
```

Or simply go to **Failures → Exceptions** in the Application Insights UI.

## Where Your Telemetry Appears

| Function                     | Application Insights Location | KQL Table      |
| ---------------------------- | ----------------------------- | -------------- |
| `trackServerEvent()`         | Logs → traces                 | `traces`       |
| `trackServerException()`     | Failures → Exceptions         | `exceptions`   |
| `trackServerMetric()`        | Logs → traces                 | `traces`       |
| `withServerSpan()`           | Performance → Dependencies    | `dependencies` |
| HTTP Requests (automatic)    | Performance → Server          | `requests`     |
| Database Queries (automatic) | Performance → Dependencies    | `dependencies` |

## Example Usage

### Track a Business Event

```typescript
import { trackServerEvent } from "@/lib/telemetry-server";

export async function createOrder(userId: string, amount: number) {
  // Your business logic
  const order = await createOrderInDb({ userId, amount });

  // Track the event
  trackServerEvent("OrderCreated", {
    userId,
    orderId: order.id,
    amount,
    currency: "USD",
  });

  return order;
}
```

**Find it in Application Insights:**

```kusto
traces
| where message contains "CustomEvent: OrderCreated"
| extend userId = tostring(customDimensions.userId)
| extend amount = todouble(customDimensions.amount)
| project timestamp, userId, amount, customDimensions
```

### Track an Exception

```typescript
import { trackServerException } from "@/lib/telemetry-server";

try {
  await paymentService.processPayment(paymentData);
} catch (error) {
  if (error instanceof Error) {
    trackServerException(error, {
      userId: user.id,
      orderId: order.id,
      paymentMethod: "credit_card",
      operation: "processPayment",
    });
  }
  throw error;
}
```

**Find it in Application Insights:**

```kusto
exceptions
| where timestamp > ago(24h)
| extend userId = tostring(customDimensions.userId)
| extend operation = tostring(customDimensions.operation)
| project timestamp, type, outerMessage, userId, operation
```

## Quick Reference

### Installation

```bash
pnpm add @azure/monitor-opentelemetry @opentelemetry/api @opentelemetry/api-logs
```

### Environment Variable

```bash
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

### Test Endpoint

```bash
curl http://localhost:3000/api/telemetry-test?action=all
```

### KQL Queries

**All custom events:**

```kusto
traces | where message contains "CustomEvent:"
```

**All exceptions:**

```kusto
exceptions | where timestamp > ago(1h)
```

**All telemetry:**

```kusto
union traces, exceptions, requests, dependencies
| where timestamp > ago(1h)
| order by timestamp desc
```

## Files Modified

✅ `src/lib/telemetry-server.ts` - Added Logs API, improved tracking  
✅ `instrumentation.node.ts` - Configured logging options  
✅ `src/app/api/telemetry-test/route.ts` - **NEW** Test endpoint  
✅ `SERVER_TELEMETRY_TROUBLESHOOTING.md` - **NEW** Troubleshooting guide  
✅ `SERVER_TELEMETRY_FIX_SUMMARY.md` - **NEW** This summary  
✅ `package.json` - Added `@opentelemetry/api-logs`

## Console Output

When telemetry functions are called, you'll see immediate feedback:

```
[Telemetry] Event tracked: UserLoggedIn { userId: '123', method: 'password' }
[Telemetry] Exception tracked: ValidationError: Invalid email { userId: '456' }
```

This helps you know the telemetry was called, even before checking Application Insights.

## Important Notes

### ⚠️ Data Model Differences

**OpenTelemetry uses:**

- Traces (logs) for custom events
- Spans for distributed tracing
- Metrics for performance counters

**Classic Application Insights uses:**

- CustomEvents for custom events
- PageViews for page tracking
- Traces for logs

They're different but both work! You just need to query the right tables.

### ⚠️ Sampling

By default, sampling is set to 1.0 (100% of telemetry is tracked).

If you want to reduce telemetry volume:

```typescript
// instrumentation.node.ts
useAzureMonitor({
  samplingRatio: 0.5, // Track 50% of requests
});
```

### ⚠️ Wait Time

Application Insights ingestion can take 2-3 minutes. Don't panic if data doesn't appear immediately!

## Troubleshooting Checklist

- [ ] Environment variable `APPLICATIONINSIGHTS_CONNECTION_STRING` is set
- [ ] Dev server restarted after setting environment variable
- [ ] Connection string is valid and correct
- [ ] Waited 2-3 minutes for data to appear
- [ ] Looking in the correct table (`traces` not `customEvents`)
- [ ] Using correct KQL queries
- [ ] Console shows `[Telemetry]` messages
- [ ] Console shows initialization success message

## Success! 🎉

Your server-side telemetry is now **fully functional**. Events, exceptions, and metrics are all being tracked and will appear in Application Insights.

The key insight: **Look in the `traces` table for custom events**, not the `customEvents` table. This is how OpenTelemetry works with Azure Monitor.
