# Console Filtering for Application Insights

## Overview

The client-side Application Insights console tracking now includes **intelligent filtering** to prevent unwanted console messages from being sent to Azure Application Insights.

## Default Filters

By default, the following messages are automatically filtered out:

- `[Fast Refresh]` - Next.js Fast Refresh messages
- `[HMR]` - Hot Module Replacement messages
- `[webpack-dev-server]` - Webpack dev server messages
- `[Turbopack]` - Turbopack build messages

These filters help reduce noise from development tools and keep your telemetry focused on actual application issues.

## Quick Start

### Add Custom Filters

```typescript
import {
  addConsoleFilter,
  addConsoleFilters,
} from "@/lib/application-insights";

// Add a single filter
addConsoleFilter("[MyFilter]");

// Add multiple filters
addConsoleFilters(["[DEV]", "[DEBUG]", "VERBOSE:"]);
```

### How It Works

When you add a filter, any console message **containing that text** will be:

- ✅ **Still shown** in the browser console (for local debugging)
- ❌ **Not sent** to Application Insights (to reduce noise/costs)

### Example

```typescript
// Add filter
addConsoleFilter("[Fast Refresh]");

// This appears in console but NOT in Application Insights
console.log("[Fast Refresh] Rebuilding...");

// This appears in BOTH console AND Application Insights
console.log("User clicked submit button");
```

## API Reference

### Add Filters

```typescript
// Add single filter
addConsoleFilter(filter: string): void

// Add multiple filters
addConsoleFilters(filters: string[]): void
```

### Remove Filters

```typescript
// Remove specific filter
removeConsoleFilter(filter: string): void

// Clear all custom filters (keeps defaults)
clearCustomConsoleFilters(): void
```

### View Filters

```typescript
// Get all active filters (default + custom)
getActiveConsoleFilters(): string[]

// Get only custom filters
getCustomConsoleFilters(): string[]
```

## Common Use Cases

### 1. Filter Development Messages

```typescript
addConsoleFilters(["[DEV]", "[DEBUG]", "VERBOSE:", "TRACE:"]);
```

### 2. Filter Third-Party Libraries

```typescript
addConsoleFilters([
  "[React DevTools]",
  "[Redux]",
  "Download the React DevTools",
]);
```

### 3. Filter Your Own Tracking Logs

```typescript
// Prevent duplicate tracking
addConsoleFilters(["[Analytics]", "[Telemetry]", "[Tracking]"]);
```

### 4. Environment-Specific Filtering

```typescript
if (process.env.NODE_ENV === "development") {
  addConsoleFilters(["[Fast Refresh]", "[HMR]", "[Turbopack]"]);
}

if (process.env.NODE_ENV === "production") {
  addConsoleFilters(["[DEBUG]", "VERBOSE:"]);
}
```

## Setup in Your App

Add filters during Application Insights initialization:

```typescript
// app/layout.tsx
"use client";

import { useEffect } from "react";
import { initializeAppInsights, addConsoleFilters } from "@/lib/application-insights";

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize Application Insights
    initializeAppInsights();

    // Configure console filters
    addConsoleFilters([
      "[Fast Refresh]",
      "[HMR]",
      "[Turbopack]",
      "[DEBUG]",
      "[DEV]",
    ]);
  }, []);

  return <html><body>{children}</body></html>;
}
```

## Benefits

✅ **Reduce Telemetry Costs** - Filter out noisy development messages  
✅ **Cleaner Data** - Focus on actual application issues  
✅ **Better Signal-to-Noise Ratio** - Easier to find real problems  
✅ **Flexible** - Add/remove filters as needed  
✅ **Safe** - Messages still appear in browser console for debugging

## Example Filters by Category

### Development Tools

```typescript
["[Fast Refresh]", "[HMR]", "[webpack", "[Turbopack]"];
```

### Debugging

```typescript
["[DEBUG]", "[DEV]", "VERBOSE:", "TRACE:"];
```

### Third-Party Libraries

```typescript
["[React DevTools]", "[Redux]", "[Apollo", "Download the"];
```

### Custom Analytics

```typescript
["[Analytics]", "[GA]", "[Tracking]", "[Telemetry]"];
```

## Files Modified

- ✅ `src/lib/application-insights.ts` - Added filtering logic
- ✅ `src/lib/application-insights-filter-examples.ts` - Usage examples
- ✅ `APPLICATION_INSIGHTS_SETUP.md` - Updated documentation
- ✅ `CONSOLE_FILTER_GUIDE.md` - This guide

## Testing

To verify filters are working:

```typescript
import {
  addConsoleFilter,
  getActiveConsoleFilters,
} from "@/lib/application-insights";

// Add a test filter
addConsoleFilter("[TEST]");

// Verify it's added
console.log(getActiveConsoleFilters());
// Output: [...default filters..., "[TEST]"]

// This won't be tracked
console.log("[TEST] This is filtered");

// This will be tracked
console.log("This is NOT filtered");
```

## Notes

- Filters are **case-sensitive**
- Filters use **substring matching** (partial matches work)
- Default filters **cannot be removed** (only custom filters can be removed)
- Filters apply to **all console methods** (log, warn, error, info, debug)
- Console tracking must be **enabled** for filters to work

## See Also

- [APPLICATION_INSIGHTS_SETUP.md](./APPLICATION_INSIGHTS_SETUP.md) - Full setup guide
- [application-insights-filter-examples.ts](./src/lib/application-insights-filter-examples.ts) - Code examples
