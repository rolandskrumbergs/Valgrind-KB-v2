# Quick Reference: Exception Tracking Fix

## What Changed

Updated `trackServerException()` in `src/lib/telemetry-server.ts` to use **SpanKind.SERVER** instead of **SpanKind.INTERNAL**.

## Why It Matters

Azure Monitor only maps exceptions to the exceptions table when they're recorded on SERVER-kind spans or active request spans.

## How to Test

### 1. Start Dev Server

```powershell
pnpm dev
```

### 2. Trigger Test Exception

```powershell
# Test just exceptions
curl http://localhost:3000/api/telemetry-test?action=exception

# Or test all telemetry types
curl http://localhost:3000/api/telemetry-test?action=all
```

### 3. Query Application Insights (wait 2-5 minutes)

```kql
exceptions
| where timestamp > ago(1h)
| order by timestamp desc
```

## Expected Results

✅ Exceptions appear in `exceptions` table with:

- Correct exception type and message
- Custom properties in `customDimensions`
- Stack trace in exception details

✅ Exceptions also appear in `traces` table as ERROR logs (redundant logging)

## Usage in Your Code

### API Routes (Automatic)

```typescript
export async function GET(request: Request) {
  try {
    // your code
  } catch (error) {
    trackServerException(error as Error, { endpoint: "/api/example" });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Server Actions (Automatic)

```typescript
"use server";

export async function myAction() {
  try {
    // your code
  } catch (error) {
    trackServerException(error as Error, { action: "myAction" });
    return { success: false };
  }
}
```

### Background Tasks (Automatic SERVER span creation)

```typescript
try {
  // background task
} catch (error) {
  trackServerException(error as Error, { context: "background" });
}
```

## Technical Details

### Before (INTERNAL span - didn't work)

```typescript
const span = tracer.startSpan(`Exception: ${error.name}`, {
  kind: SpanKind.INTERNAL, // ❌ Wrong kind
  // ...
});
span.recordException(error);
```

### After (SERVER span or active span - works)

```typescript
// Option 1: Use active request span (when available)
const activeSpan = trace.getActiveSpan();
if (activeSpan) {
  activeSpan.recordException(error); // ✅ Works
}

// Option 2: Create SERVER span (fallback)
else {
  const span = tracer.startSpan(`Exception: ${error.name}`, {
    kind: SpanKind.SERVER, // ✅ Correct kind
    // ...
  });
  span.recordException(error);
}
```

## Documentation

- **Detailed Explanation**: `SERVER_EXCEPTION_TRACKING_FIX.md`
- **Troubleshooting Guide**: `SERVER_TELEMETRY_TROUBLESHOOTING.md` (Problem 4)
- **Full API Reference**: `SERVER_TELEMETRY.md`

## Next Steps

1. Test the fix with the test endpoint
2. Verify exceptions appear in Application Insights
3. Deploy to staging/production
4. Monitor exception tracking in production
