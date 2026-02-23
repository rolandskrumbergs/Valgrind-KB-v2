# Server-Side Telemetry with Azure Monitor OpenTelemetry

This document explains how server-side Node.js telemetry tracking has been set up using Azure Monitor OpenTelemetry for Next.js.

## Overview

Server-side telemetry tracks:

- **HTTP requests** to API routes and server components
- **Database queries** (PostgreSQL automatically instrumented)
- **External API calls** and dependencies
- **Custom events** and metrics
- **Exceptions** and errors on the server
- **Server Actions** performance
- **Authentication events**
- **Business events**
- **Custom spans** for specific operations

## Architecture

### Client-Side vs Server-Side Telemetry

This application uses a **dual telemetry setup**:

| Aspect                   | Client-Side                                         | Server-Side                                |
| ------------------------ | --------------------------------------------------- | ------------------------------------------ |
| **Library**              | `@microsoft/applicationinsights-web`                | `@azure/monitor-opentelemetry`             |
| **Technology**           | Application Insights JavaScript SDK                 | OpenTelemetry with Azure Monitor           |
| **Environment Variable** | `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` | `APPLICATIONINSIGHTS_CONNECTION_STRING`    |
| **Tracks**               | Browser interactions, page views, client errors     | API routes, server actions, database calls |
| **Initialization**       | `src/lib/application-insights.ts`                   | `src/lib/telemetry-server.ts`              |
| **Entry Point**          | `src/app/layout.tsx` (AppInsightsProvider)          | `instrumentation.ts` (Next.js hook)        |

Both can use the **same Application Insights resource** in Azure, allowing you to see both client and server telemetry in one place.

## Setup

### 1. Environment Variables

Add the following to your `.env` or `.env.local` file:

```bash
# Server-side telemetry (no NEXT_PUBLIC prefix - server only)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key-here;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/;LiveEndpoint=https://your-region.livediagnostics.monitor.azure.com/;ApplicationId=your-app-id

# Client-side telemetry (with NEXT_PUBLIC prefix - browser)
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key-here;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/;LiveEndpoint=https://your-region.livediagnostics.monitor.azure.com/;ApplicationId=your-app-id
```

**Important Notes:**

- Both can use the **same connection string** (same Application Insights resource)
- The `APPLICATIONINSIGHTS_CONNECTION_STRING` is **server-only** (no `NEXT_PUBLIC_` prefix)
- Do **NOT** add quotes around the connection string
- Copy the full connection string from Azure Portal

### 2. Get Your Connection String

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to your Application Insights resource (or create one)
3. Copy the **Connection String** from the Overview page
4. Paste it into both environment variables (they can be the same)

### 3. Installed Packages

The following packages have been installed:

```json
{
  "@azure/monitor-opentelemetry": "^1.x.x",
  "@opentelemetry/api": "^1.9.0"
}
```

## How It Works

### Automatic Instrumentation

The server-side telemetry is automatically initialized via Next.js's `instrumentation.ts` file, which runs before any other server code. OpenTelemetry automatically instruments:

- ✅ **HTTP requests** (all incoming requests to your Next.js app)
- ✅ **PostgreSQL queries** (via Drizzle ORM)
- ✅ **Azure SDK calls** (if you use Azure services)
- ✅ **Fetch/HTTPS requests** (outgoing API calls)

No manual tracking needed for these!

### Files Added

- ✅ `instrumentation.ts` - Next.js instrumentation hook (auto-loads telemetry)
- ✅ `src/lib/telemetry-server.ts` - Server-side telemetry utilities
- ✅ `src/lib/env.ts` - Updated with `APPLICATIONINSIGHTS_CONNECTION_STRING`
- ✅ `SERVER_TELEMETRY.md` - This documentation

## Usage Examples

### 1. Track Custom Events

```typescript
import { trackServerEvent } from "@/lib/telemetry-server";

// In a server action or API route
export async function myServerAction() {
  trackServerEvent("UserCreated", {
    role: "admin",
    source: "invitation",
  });

  // Your logic here
}
```

### 2. Track Custom Metrics

```typescript
import { trackServerMetric } from "@/lib/telemetry-server";

// Track processing time
const startTime = Date.now();
await processData();
const duration = Date.now() - startTime;

trackServerMetric("DataProcessingTime", duration, {
  recordCount: 100,
  dataType: "users",
});
```

### 3. Track Exceptions

```typescript
import { trackServerException } from "@/lib/telemetry-server";

try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    trackServerException(error, {
      operation: "riskyOperation",
      userId: user.id,
      severity: "high",
    });
  }
  throw error;
}
```

### 4. Track with Custom Spans

Use spans to measure the performance of specific operations:

```typescript
import { withServerSpan } from "@/lib/telemetry-server";

export async function fetchUserData(userId: string) {
  return withServerSpan(
    "fetch-user-data",
    async (span) => {
      // Set custom attributes
      span.setAttribute("user.id", userId);

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      span.setAttribute("user.found", !!user);
      return user;
    },
    {
      operation: "database",
      table: "users",
    },
  );
}
```

### 5. Wrap Server Actions with Telemetry

Use the higher-order function to automatically track server actions:

```typescript
import { withTelemetry } from "@/lib/telemetry-server";

// Wrap your server action
export const createCustomer = withTelemetry(
  "createCustomer",
  async (data: CustomerInput) => {
    // Your server action logic
    const customer = await db.insert(customers).values(data);
    return customer;
  },
);

// The function is automatically tracked with:
// - Execution time
// - Success/failure status
// - Any errors that occur
```

### 6. Track Database Queries

```typescript
import { trackDatabaseQuery } from "@/lib/telemetry-server";

const startTime = Date.now();
try {
  const users = await db.query.users.findMany();
  const duration = Date.now() - startTime;

  trackDatabaseQuery("SELECT", "users", duration, true, {
    rowCount: users.length,
  });

  return users;
} catch (error) {
  const duration = Date.now() - startTime;
  trackDatabaseQuery("SELECT", "users", duration, false);
  throw error;
}
```

### 7. Track API Calls

```typescript
import { trackApiCall } from "@/lib/telemetry-server";

const startTime = Date.now();
try {
  const response = await fetch("https://api.example.com/data");
  const duration = Date.now() - startTime;

  trackApiCall(
    "GET",
    "https://api.example.com/data",
    duration,
    response.status,
    response.ok,
    {
      endpoint: "data",
      service: "example-api",
    },
  );

  return response.json();
} catch (error) {
  const duration = Date.now() - startTime;
  trackApiCall("GET", "https://api.example.com/data", duration, 0, false);
  throw error;
}
```

### 8. Track Authentication Events

```typescript
import { trackAuthEvent } from "@/lib/telemetry-server";

// On successful login
export async function handleLogin(credentials: LoginCredentials) {
  try {
    const user = await authenticateUser(credentials);

    trackAuthEvent("login", user.id, true, {
      method: "email-password",
      ipAddress: request.ip,
    });

    return user;
  } catch (error) {
    trackAuthEvent("login", credentials.email, false, {
      reason: "invalid-credentials",
    });
    throw error;
  }
}

// On logout
export async function handleLogout(userId: string) {
  trackAuthEvent("logout", userId, true);
  // Your logout logic
}
```

### 9. Track Business Events

```typescript
import { trackBusinessEvent } from "@/lib/telemetry-server";

// Track license purchases
export async function purchaseLicense(customerId: string, licenseType: string) {
  const license = await createLicense(customerId, licenseType);

  trackBusinessEvent("license-purchased", {
    customer_id: customerId,
    license_type: licenseType,
    license_id: license.id,
    amount: license.price,
  });

  return license;
}

// Track feature usage
export async function useFeature(feature: string, userId: string) {
  trackBusinessEvent("feature-used", {
    feature_name: feature,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
```

## Real-World Example: Server Action with Telemetry

Here's a complete example of a server action with comprehensive telemetry:

```typescript
"use server";

import {
  withServerSpan,
  trackServerException,
  trackBusinessEvent,
} from "@/lib/telemetry-server";
import { db } from "@/db";
import { customers } from "@/db/schema";

export async function createCustomerAction(data: CustomerInput) {
  return withServerSpan(
    "create-customer-action",
    async (span) => {
      try {
        // Set custom attributes
        span.setAttribute("customer.email", data.email);
        span.setAttribute("customer.company", data.companyName);

        // Insert customer
        const [customer] = await db.insert(customers).values(data).returning();

        // Track business event
        trackBusinessEvent("customer-created", {
          customer_id: customer.id,
          company_name: customer.companyName,
          has_licenses: false,
        });

        span.setAttribute("customer.id", customer.id);
        span.setAttribute("result", "success");

        return { success: true, customer };
      } catch (error) {
        // Track exception
        if (error instanceof Error) {
          trackServerException(error, {
            operation: "create-customer",
            customerEmail: data.email,
          });
          span.setAttribute("error.message", error.message);
        }

        span.setAttribute("result", "failure");
        throw error;
      }
    },
    {
      action_type: "create",
      entity: "customer",
    },
  );
}
```

## API Routes Example

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withServerSpan, trackServerException } from "@/lib/telemetry-server";

export async function GET(request: NextRequest) {
  return withServerSpan("api-get-users", async (span) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const limit = searchParams.get("limit") || "10";

      span.setAttribute("query.limit", limit);

      const users = await db.query.users.findMany({
        limit: parseInt(limit),
      });

      span.setAttribute("users.count", users.length);

      return NextResponse.json(users);
    } catch (error) {
      if (error instanceof Error) {
        trackServerException(error, {
          route: "/api/users",
          method: "GET",
        });
      }

      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }
  });
}
```

## Monitoring in Azure Portal

### View Server-Side Telemetry

1. Go to your Application Insights resource
2. Navigate to different sections:
   - **Performance**: See API response times and dependencies
   - **Failures**: View server-side exceptions
   - **Logs**: Query custom events and traces
   - **Live Metrics**: Real-time server monitoring
   - **Application Map**: Visualize dependencies

### Sample KQL Queries

#### View Custom Events

```kusto
traces
| where customDimensions.event_name != ""
| project timestamp, message, customDimensions
| order by timestamp desc
```

#### View Server Exceptions

```kusto
exceptions
| where cloud_RoleName contains "kb-admin"
| project timestamp, type, outerMessage, customDimensions
| order by timestamp desc
```

#### API Performance

```kusto
requests
| where url contains "/api/"
| summarize
    avgDuration = avg(duration),
    p95Duration = percentile(duration, 95),
    count = count()
  by name
| order by avgDuration desc
```

#### Database Query Performance

```kusto
dependencies
| where type == "postgresql"
| summarize
    avgDuration = avg(duration),
    count = count()
  by name
| order by avgDuration desc
```

## Best Practices

### 1. Event Naming

Use consistent naming conventions:

- ✅ **Custom Events**: `entity-action` (e.g., `customer-created`, `license-activated`)
- ✅ **Spans**: `operation-description` (e.g., `fetch-user-data`, `send-invitation-email`)
- ✅ **Metrics**: `MetricName` (e.g., `EmailDeliveryTime`, `BatchProcessingCount`)

### 2. Properties

Use consistent property naming:

- ✅ Use `snake_case` for property keys
- ✅ Include context: `user_id`, `customer_id`, `operation_type`
- ✅ Don't include PII (passwords, tokens, sensitive data)

### 3. Performance

- ✅ Use spans for operations > 100ms
- ✅ Don't track too frequently (avoid loops with millions of iterations)
- ✅ Use sampling in production if needed

### 4. Error Handling

Always track exceptions with context:

```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof Error) {
    trackServerException(error, {
      operation: "operation-name",
      userId: user.id,
      context: "relevant-context",
    });
  }
  throw error; // Re-throw for proper error handling
}
```

### 5. Avoid Over-Tracking

Don't track:

- ❌ Every database query (use automatic instrumentation)
- ❌ Health check endpoints
- ❌ Static file requests
- ❌ Sensitive data (passwords, tokens, credit cards)

## Troubleshooting

### Telemetry Not Showing Up

1. **Check environment variable**: Ensure `APPLICATIONINSIGHTS_CONNECTION_STRING` is set
2. **Restart dev server**: Changes to `instrumentation.ts` require restart
3. **Check console**: Look for initialization message: `✅ Azure Monitor OpenTelemetry initialized successfully`
4. **Wait 2-3 minutes**: Azure Portal has delays
5. **Check Azure Portal**: Ensure the connection string is valid

### "Connection string not found" Warning

Solution:

1. Add `APPLICATIONINSIGHTS_CONNECTION_STRING` to `.env` or `.env.local`
2. Restart the dev server (`pnpm dev`)

### Duplicate Telemetry

If you see duplicate events, ensure you're not:

- Calling tracking functions multiple times
- Mixing automatic and manual instrumentation
- Using both client and server tracking for the same event

## Environment-Specific Configuration

### Development vs Production

Use different connection strings per environment:

```bash
# .env.development
APPLICATIONINSIGHTS_CONNECTION_STRING=your-dev-connection-string

# .env.production
APPLICATIONINSIGHTS_CONNECTION_STRING=your-prod-connection-string
```

Or use the same resource and filter by environment:

```typescript
trackServerEvent("UserCreated", {
  environment: process.env.NODE_ENV,
  // ... other properties
});
```

## Sampling

To reduce telemetry volume in production, adjust the sampling ratio in `src/lib/telemetry-server.ts`:

```typescript
useAzureMonitor({
  azureMonitorExporterOptions: {
    connectionString,
  },
  samplingRatio: 0.5, // Track 50% of requests
});
```

## Additional Resources

- [Azure Monitor OpenTelemetry Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs)
- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/languages/js/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Application Insights Overview](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Client-Side Telemetry Setup](./APPLICATION_INSIGHTS_SETUP.md)

## Summary

You now have comprehensive server-side telemetry tracking with:

- ✅ Automatic HTTP request tracking
- ✅ Automatic database query tracking (PostgreSQL)
- ✅ Custom event tracking
- ✅ Custom metrics
- ✅ Exception tracking
- ✅ Custom spans for performance monitoring
- ✅ Server action instrumentation
- ✅ Authentication event tracking
- ✅ Business event tracking

All telemetry data flows to Azure Application Insights where you can analyze, visualize, and set up alerts.
