# Server Exception Tracking Fix

## Problem

Server-side exceptions were not appearing in the Application Insights **exceptions** table, even though the code was using `span.recordException()` and setting error status.

## Root Cause

The issue was with the **SpanKind** used when creating exception spans:

1. **Previous Implementation**: Used `SpanKind.INTERNAL`

   - INTERNAL spans are for internal operations within an application
   - Azure Monitor doesn't map exceptions from INTERNAL spans to the exceptions table
   - The exception data was only appearing in the traces table as log entries

2. **Required Implementation**: Use `SpanKind.SERVER` or record on active request span
   - SERVER spans represent incoming HTTP requests
   - Azure Monitor properly maps exceptions from SERVER spans to the exceptions table
   - Alternatively, recording exceptions on the active request span works correctly

## Solution Implemented

The `trackServerException()` function in `src/lib/telemetry-server.ts` has been updated to:

### 1. Check for Active Span First

```typescript
const activeSpan = trace.getActiveSpan();

if (activeSpan) {
  // Record exception on the active request span
  activeSpan.recordException(error);
  activeSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });

  if (properties) {
    activeSpan.setAttributes(properties);
  }
}
```

**Why this works:**

- When called from within an API route handler, there's an active HTTP request span
- This span is automatically created by the OpenTelemetry HTTP instrumentation
- Recording the exception on this SERVER-kind span ensures proper tracking
- The exception appears in both the exceptions table and is linked to the request

### 2. Create SERVER Span as Fallback

```typescript
else {
  // No active span - create a SERVER span
  const tracer = getTracer();
  const span = tracer.startSpan(`Exception: ${error.name}`, {
    kind: SpanKind.SERVER, // Critical: SERVER kind, not INTERNAL
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
```

**Why this works:**

- For exceptions outside of request context (background tasks, startup errors, etc.)
- Creates a SERVER-kind span specifically for the exception
- Azure Monitor recognizes SERVER spans and maps exceptions appropriately
- The `exception.escaped` attribute marks it as not being part of a request

### 3. Always Log to Traces Table

Both paths still emit a log entry:

```typescript
logger.emit({
  severityNumber: 17, // ERROR level
  severityText: "ERROR",
  body: `${error.name}: ${error.message}`,
  attributes: {
    "exception.type": error.name,
    "exception.message": error.message,
    "exception.stacktrace": error.stack || "",
    ...properties,
  },
});
```

This ensures exceptions are visible in the traces table regardless of span context.

## Testing the Fix

### 1. Start the Development Server

```powershell
pnpm dev
```

### 2. Test Exception Tracking

Call the test endpoint:

```powershell
curl http://localhost:3000/api/telemetry-test?action=exception
```

Or test all telemetry:

```powershell
curl http://localhost:3000/api/telemetry-test?action=all
```

### 3. Wait for Data Propagation

Application Insights typically has a **2-5 minute delay** before data appears.

### 4. Query the Exceptions Table

In Azure Portal > Application Insights > Logs (Analytics), run:

```kql
exceptions
| where timestamp > ago(1h)
| order by timestamp desc
| project timestamp, type, outerMessage, problemId, customDimensions
```

You should see exceptions with:

- **type**: The exception name (e.g., "Error")
- **outerMessage**: The exception message (e.g., "This is a test exception from telemetry-test API")
- **customDimensions**: Any properties you passed to `trackServerException()`

### 5. Query the Traces Table (for comparison)

```kql
traces
| where timestamp > ago(1h)
| where severityLevel == 3  // ERROR level
| where message contains "Exception"
| order by timestamp desc
| project timestamp, message, severityLevel, customDimensions
```

This shows the log entries created by `logger.emit()`.

## Usage Guidelines

### ✅ Best Practice - In API Routes

```typescript
// app/api/some-endpoint/route.ts
import { trackServerException } from "@/lib/telemetry-server";

export async function GET(request: Request) {
  try {
    // Your code here
    const result = await someOperation();
    return Response.json(result);
  } catch (error) {
    // This will use the active request span automatically
    trackServerException(error as Error, {
      endpoint: "/api/some-endpoint",
      userId: "123",
    });

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### ✅ Good - In Server Actions

```typescript
// src/actions/some-action.ts
"use server";

import { trackServerException } from "@/lib/telemetry-server";

export async function someServerAction(data: FormData) {
  try {
    // Your code here
    return { success: true };
  } catch (error) {
    trackServerException(error as Error, {
      action: "someServerAction",
    });

    return { success: false, error: "Operation failed" };
  }
}
```

### ⚠️ Works - In Background Tasks

```typescript
// Some background task or startup code
import { trackServerException, withServerSpan } from "@/lib/telemetry-server";

// Option 1: Direct call (creates SERVER span automatically)
try {
  await backgroundTask();
} catch (error) {
  // Will create a SERVER span for proper tracking
  trackServerException(error as Error, {
    context: "background-task",
  });
}

// Option 2: Wrap in a span for better context
await withServerSpan("background-task", async (span) => {
  try {
    await backgroundTask();
  } catch (error) {
    // Will use the parent span from withServerSpan
    trackServerException(error as Error);
  }
});
```

## Verification Checklist

- [ ] Exceptions appear in the **exceptions** table in Application Insights
- [ ] Exceptions have proper **type** and **outerMessage** fields
- [ ] Custom properties appear in **customDimensions**
- [ ] Stack trace is visible in exception details
- [ ] Exceptions are also logged in the **traces** table (for redundancy)
- [ ] Console shows appropriate messages when exceptions are tracked

## Key Differences from Previous Implementation

| Aspect            | Before                  | After                                          |
| ----------------- | ----------------------- | ---------------------------------------------- |
| Span Kind         | `SpanKind.INTERNAL`     | `SpanKind.SERVER` (when no active span)        |
| Active Span Check | Not checked             | Checks `trace.getActiveSpan()` first           |
| Request Context   | Always created new span | Uses active request span when available        |
| Exception Table   | ❌ Not populated        | ✅ Properly populated                          |
| Traces Table      | ✅ Logged               | ✅ Still logged                                |
| Use Case Support  | Limited                 | Works in routes, actions, and background tasks |

## Additional Resources

- [OpenTelemetry Semantic Conventions - Exceptions](https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-spans/)
- [Azure Monitor OpenTelemetry - Exception Tracking](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs)
- [OpenTelemetry SpanKind Documentation](https://opentelemetry.io/docs/specs/otel/trace/api/#spankind)

## Related Files

- `src/lib/telemetry-server.ts` - Main telemetry functions
- `instrumentation.node.ts` - OpenTelemetry initialization
- `src/app/api/telemetry-test/route.ts` - Test endpoint
- `SERVER_TELEMETRY_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
