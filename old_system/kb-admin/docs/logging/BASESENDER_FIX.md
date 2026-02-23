# BaseSender Error Fix - Azure Monitor OpenTelemetry with Next.js

## Problem

When running the Next.js app with `@azure/monitor-opentelemetry`, you encountered:

```
ReferenceError: Cannot access 'BaseSender' before initialization
```

This error occurs due to circular dependency issues when Azure Monitor OpenTelemetry is bundled with **Turbopack** in Next.js 15.

## Solution

The fix involves three key changes:

### 1. Created `instrumentation.node.ts`

Next.js supports runtime-specific instrumentation files:

- `instrumentation.ts` - General (all runtimes)
- `instrumentation.node.ts` - Node.js runtime only
- `instrumentation.edge.ts` - Edge runtime only

By placing Azure Monitor initialization in `instrumentation.node.ts`, we ensure it only runs in the Node.js environment and is properly isolated from edge runtime bundling.

### 2. Added `serverExternalPackages` to `next.config.ts`

```typescript
serverExternalPackages: ["@azure/monitor-opentelemetry"];
```

This tells Next.js to **not bundle** the Azure Monitor package, preventing the circular dependency issue. The package will be loaded as an external Node.js module at runtime.

### 3. Simplified Main `instrumentation.ts`

The main instrumentation file now just serves as a placeholder since Next.js automatically uses the runtime-specific versions.

## Files Modified

| File                          | Change                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| `instrumentation.ts`          | Simplified to placeholder                                     |
| `instrumentation.node.ts`     | **NEW** - Contains Azure Monitor initialization               |
| `next.config.ts`              | Added `serverExternalPackages` configuration                  |
| `src/lib/telemetry-server.ts` | Removed initialization logic (now in instrumentation.node.ts) |

## How It Works Now

1. **Next.js starts** and detects `instrumentation.node.ts`
2. **For Node.js runtime**, it calls the `register()` function in `instrumentation.node.ts`
3. **Azure Monitor** is loaded as an external module (not bundled)
4. **Telemetry** initializes without circular dependency issues
5. **Your app** continues to run normally with telemetry enabled

## Environment Variables

Make sure you have this in your `.env` or `.env.local`:

```bash
# Server-side telemetry (required)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Optional: Disable telemetry temporarily
DISABLE_TELEMETRY=true
```

## Verification

The app should now start successfully with this message:

```
✅ Azure Monitor OpenTelemetry initialized successfully
```

If telemetry initialization fails, the app will continue running with a warning message instead of crashing.

## Alternative: Disable Turbopack (Not Recommended)

If you still encounter issues, you can disable Turbopack by changing `package.json`:

```json
"dev": "next dev"  // Remove --turbopack flag
```

However, this is **not recommended** as Turbopack provides faster development builds. The solution above works with Turbopack enabled.

## References

- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Next.js External Packages](https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages)
- [Azure Monitor OpenTelemetry](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs)

## Status

✅ **FIXED** - The BaseSender initialization error has been resolved!
