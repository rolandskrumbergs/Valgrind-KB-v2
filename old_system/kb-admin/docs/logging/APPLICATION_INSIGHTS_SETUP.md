# Application Insights Setup

This document explains how Application Insights telemetry tracking has been set up in this Next.js application.

## Overview

Application Insights is configured to track:

- Page views and route changes (automatic)
- Custom events (user actions, feature usage)
- Exceptions and errors
- Performance metrics
- API calls and dependencies
- User context (authenticated users)
- Console statements (automatic)
- React component errors (automatic with Error Boundary)

## Configuration

### 1. Environment Variables

Add your Application Insights connection string to your `.env.local` file:

```bash
# NO QUOTES NEEDED - Semicolons are preserved correctly
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key-here;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/;LiveEndpoint=https://your-region.livediagnostics.monitor.azure.com/;ApplicationId=your-app-id
```

> **Important Notes:**
>
> - The variable must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
> - **Do NOT use quotes** around the connection string in `.env` files
> - The semicolons (`;`) in the connection string are preserved correctly without escaping
> - Must start with `InstrumentationKey=` (copy the full connection string from Azure)
> - See [CONNECTION_STRING_SETUP.md](./CONNECTION_STRING_SETUP.md) for detailed troubleshooting

### 2. Get Your Connection String

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to your Application Insights resource
3. Copy the **Connection String** from the Overview page
4. Paste it into your `.env.local` file

If you don't have an Application Insights resource:

1. Create one in Azure Portal
2. Choose your subscription and resource group
3. Select a region close to your users
4. Copy the connection string once created

## Usage

### Automatic Tracking

The following are tracked automatically once configured:

- **Page Views**: Every route change in your Next.js app
- **AJAX/Fetch Requests**: All API calls made from the browser
- **Unhandled Exceptions**: Uncaught errors and promise rejections
- **Console Statements**: All console.log, console.warn, console.error, console.info, and console.debug calls

### Manual Tracking

Import the tracking functions from `@/lib/application-insights`:

```typescript
import {
  trackEvent,
  trackException,
  trackMetric,
  trackPageView,
  setAuthenticatedUserContext,
  clearAuthenticatedUserContext,
} from "@/lib/application-insights";
```

#### Track Custom Events

```typescript
// Track a user action
trackEvent("ButtonClicked", {
  buttonName: "Submit",
  page: "ContactForm",
});

// Track with measurements
trackEvent(
  "Purchase",
  { productId: "abc123", userId: "user-456" },
  { amount: 99.99, quantity: 2 },
);
```

#### Track Exceptions

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    trackException(error, 3, {
      // 3 = Error severity
      operation: "riskyOperation",
      userId: currentUser.id,
    });
  }
  throw error;
}
```

**Severity Levels:**

- 0: Verbose
- 1: Information
- 2: Warning
- 3: Error
- 4: Critical

#### Track Metrics

```typescript
// Track page load time
trackMetric("PageLoadTime", 1234, {
  page: "Dashboard",
  unit: "milliseconds",
});

// Track business metrics
trackMetric("ActiveUsers", 42);
```

#### Set User Context

```typescript
// After user logs in
setAuthenticatedUserContext(user.id, user.accountId);

// Before user logs out
clearAuthenticatedUserContext();
```

This enriches all subsequent telemetry with user information.

## React Component Examples

### Track Page View

```typescript
"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/application-insights";

export function MyPage() {
  useEffect(() => {
    trackPageView("MyPage", window.location.href);
  }, []);

  return <div>Content</div>;
}
```

### Track User Actions

```typescript
"use client";

import { trackEvent } from "@/lib/application-insights";

export function MyButton() {
  const handleClick = () => {
    trackEvent("ButtonClicked", {
      buttonId: "submit-form",
      componentName: "MyButton",
    });

    // Your button logic here
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Error Boundary Integration

```typescript
"use client";

import React from "react";
import { trackException } from "@/lib/application-insights";

export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackException(error, 4, {
      componentStack: errorInfo.componentStack || "",
      errorBoundary: "GlobalErrorBoundary",
    });
  }

  render() {
    // Your error UI
  }
}
```

## Console Tracking

### Automatic Console Tracking

Console tracking is **enabled by default** when Application Insights is initialized. All console statements are automatically sent to Application Insights:

- `console.log()` → Tracked as **Information** traces
- `console.info()` → Tracked as **Information** traces
- `console.warn()` → Tracked as **Warning** traces
- `console.error()` → Tracked as **Error** traces (or exceptions if Error object)
- `console.debug()` → Tracked as **Verbose** traces

**Example:**

```typescript
// These are automatically tracked in Application Insights
console.log("User logged in successfully");
console.warn("API response took longer than expected");
console.error("Failed to fetch data", new Error("Network error"));
console.info("Processing 100 items");
console.debug("Variable state:", { count: 5, active: true });
```

### Viewing Console Logs in Azure Portal

1. Navigate to your Application Insights resource
2. Go to **Logs** → **Traces** table
3. Filter by `severityLevel` or `customDimensions.consoleMethod`

**Example KQL Query:**

```kusto
traces
| where customDimensions.consoleMethod in ("log", "warn", "error", "info", "debug")
| project timestamp, message, severityLevel, consoleMethod = customDimensions.consoleMethod
| order by timestamp desc
```

### Disable Console Tracking

If you want to disable automatic console tracking:

```typescript
import { disableConsoleTracking } from "@/lib/application-insights";

// Disable console tracking
disableConsoleTracking();
```

To re-enable:

```typescript
import { enableConsoleTracking } from "@/lib/application-insights";

// Re-enable console tracking
enableConsoleTracking();
```

### Filter Console Messages

You can filter out specific console messages from being sent to Application Insights. By default, the following are filtered:

- `[Fast Refresh]` - Next.js Fast Refresh messages
- `[HMR]` - Hot Module Replacement messages
- `[webpack-dev-server]` - Webpack dev server messages
- `[Turbopack]` - Turbopack messages

**Add Custom Filters:**

```typescript
import {
  addConsoleFilter,
  addConsoleFilters,
} from "@/lib/application-insights";

// Add a single filter
addConsoleFilter("[My Custom Filter]");

// Add multiple filters at once
addConsoleFilters(["DEBUG:", "VERBOSE:", "[Internal]"]);

// Now these messages won't be sent to Application Insights:
console.log("[My Custom Filter] This won't be tracked");
console.log("DEBUG: This won't be tracked either");
```

**Manage Filters:**

```typescript
import {
  removeConsoleFilter,
  clearCustomConsoleFilters,
  getActiveConsoleFilters,
  getCustomConsoleFilters,
} from "@/lib/application-insights";

// Remove a specific filter
removeConsoleFilter("[My Custom Filter]");

// Clear all custom filters (keeps default filters)
clearCustomConsoleFilters();

// View all active filters
const allFilters = getActiveConsoleFilters();
console.log("Active filters:", allFilters);

// View only custom filters
const customFilters = getCustomConsoleFilters();
console.log("Custom filters:", customFilters);
```

**Common Use Cases:**

```typescript
// Filter out development/debugging logs
addConsoleFilters(["[DEV]", "[DEBUG]", "VERBOSE:"]);

// Filter out third-party library noise
addConsoleFilters(["[React DevTools]", "[Redux]"]);

// Filter out specific features during testing
addConsoleFilter("[Analytics]");
addConsoleFilter("[Tracking]");
```

### Console Tracking in Production

**⚠️ Important Considerations:**

1. **Performance**: Console tracking adds minimal overhead but can increase telemetry volume
2. **Sensitive Data**: Be careful not to log sensitive information (passwords, tokens, PII)
3. **Telemetry Volume**: High-frequency logging can increase Azure costs
4. **Filtering**: Consider filtering out debug/verbose logs in production

**Recommended: Conditional Console Tracking**

Modify `src/lib/application-insights.ts` initialization to only track certain levels in production:

```typescript
// Only track warnings and errors in production
if (process.env.NODE_ENV === "production") {
  // Manually override console.warn and console.error only
} else {
  // Track all console statements in development
  enableConsoleTracking();
}
```

## React Error Tracking

### Error Boundary with React Plugin

The React plugin is integrated for enhanced component error tracking. Use the provided error boundary component:

```tsx
import { AppInsightsErrorBoundary } from "@/components/app-insights-error-boundary";

export default function MyApp() {
  return (
    <AppInsightsErrorBoundary>
      <YourComponents />
    </AppInsightsErrorBoundary>
  );
}
```

**Benefits:**

- Automatically tracks React component errors
- Includes component stack traces
- Shows component hierarchy
- Captures props and state context

See [REACT_PLUGIN.md](./REACT_PLUGIN.md) for detailed React plugin documentation.

## API Route Tracking

For tracking in API routes, you'll need to implement server-side tracking separately (this setup is for client-side tracking only).

## Best Practices

1. **Event Names**: Use consistent, descriptive names (PascalCase recommended)

   - ✅ `UserLogin`, `FormSubmitted`, `FeatureEnabled`
   - ❌ `click`, `event1`, `something`

2. **Properties**: Use lowercase keys with underscores

   - ✅ `{ user_id: "123", page_name: "dashboard" }`
   - ❌ `{ UserID: "123", PageName: "dashboard" }`

3. **Measurements**: Only for numeric values

   - ✅ `{ duration: 1234, count: 5, amount: 99.99 }`
   - ❌ `{ status: "success", name: "test" }`

4. **Error Tracking**: Always include context

   ```typescript
   trackException(error, 3, {
     component: "UserProfile",
     action: "saveProfile",
     userId: user.id,
   });
   ```

5. **User Privacy**: Don't track PII (personally identifiable information)

   - ❌ Don't track: emails, full names, addresses, phone numbers
   - ✅ Do track: user IDs, anonymized identifiers

6. **Performance**: Don't track too frequently
   - Use sampling for high-frequency events
   - Batch similar events when possible

## Monitoring in Azure Portal

### View Your Data

1. Go to your Application Insights resource in Azure Portal
2. Navigate to different sections:
   - **Overview**: Quick metrics and charts
   - **Live Metrics**: Real-time telemetry
   - **Transaction Search**: Search individual events
   - **Failures**: View exceptions and errors
   - **Performance**: API and page performance
   - **Users**: User behavior and flows

### Create Custom Dashboards

1. Navigate to **Logs** in Application Insights
2. Write KQL (Kusto Query Language) queries
3. Pin results to dashboards

Example queries:

```kusto
// Top 10 most common exceptions
exceptions
| summarize count() by type
| top 10 by count_

// Average page load time by page
pageViews
| summarize avg(duration) by name
| order by avg_duration desc

// Custom events in the last 24 hours
customEvents
| where timestamp > ago(24h)
| summarize count() by name
```

### Set Up Alerts

1. Navigate to **Alerts** in Application Insights
2. Create alert rules for:
   - High error rates
   - Slow response times
   - Unusual patterns

## Troubleshooting

### Telemetry Not Showing Up

1. **Check connection string**: Ensure it's in `.env.local` with `NEXT_PUBLIC_` prefix
2. **Restart dev server**: Environment variables require restart
3. **Check browser console**: Look for Application Insights errors
4. **Verify initialization**: Check that `AppInsightsProvider` is in your layout
5. **Wait 2-3 minutes**: Azure Portal can have delays

### Connection String Not Found Warning

If you see this warning in console:

```
Application Insights connection string not found. Telemetry tracking is disabled.
```

Solution:

1. Create `.env.local` file in project root
2. Add: `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string`
3. Restart dev server

### Development vs Production

- **Development**: Telemetry will show your local testing activity
- **Production**: Set different connection strings per environment
- **Filtering**: Use filters in Azure Portal to separate environments

## Environment-Specific Configuration

For different environments, use different connection strings:

```bash
# .env.development.local
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=your-dev-connection-string

# .env.production.local
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=your-prod-connection-string
```

Or use a single resource and add custom properties:

```typescript
trackEvent("UserAction", {
  environment: process.env.NODE_ENV,
  // ... other properties
});
```

## Installed Packages

The following packages are installed for Application Insights:

```json
{
  "@microsoft/applicationinsights-web": "^3.3.10",
  "@microsoft/applicationinsights-react-js": "^19.3.8"
}
```

## Additional Resources

- [Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
- [Application Insights React Plugin](https://github.com/microsoft/applicationinsights-react-js)
- [KQL Query Language](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [React Plugin Guide](./REACT_PLUGIN.md)
- [Console Tracking Guide](./CONSOLE_TRACKING.md)
- [Connection String Setup](./CONNECTION_STRING_SETUP.md)

## Files Added/Modified

- ✅ `src/lib/application-insights.ts` - Core tracking functions with React plugin
- ✅ `src/lib/application-insights-examples.ts` - Usage examples
- ✅ `src/lib/application-insights-console-examples.ts` - Console tracking examples
- ✅ `src/components/app-insights-provider.tsx` - Provider component
- ✅ `src/components/app-insights-error-boundary.tsx` - React Error Boundary
- ✅ `src/app/layout.tsx` - Initialization in root layout
- ✅ `src/lib/env.ts` - Environment variable configuration
- ✅ `.env.example` - Environment variable template
