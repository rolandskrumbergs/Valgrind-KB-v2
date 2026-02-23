/**
 * Server-side telemetry using Azure Monitor OpenTelemetry
 * This module provides server-side telemetry tracking for Next.js API routes,
 * server actions, and server components.
 *
 * Note: Initialization is handled in instrumentation.ts to avoid circular dependency issues.
 *
 * IMPORTANT: OpenTelemetry primarily tracks traces (spans). Custom events and exceptions
 * show up in Application Insights as traces with special attributes. To see them:
 * - Go to Application Insights > Logs (Analytics)
 * - Query the "traces" table or "exceptions" table
 * - Filter by custom dimensions
 */

import {
  trace,
  context,
  SpanStatusCode,
  Span,
  SpanKind,
} from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";

// Type alias for telemetry properties
type TelemetryProperties = Record<string, string | number | boolean>;

/**
 * Get the logger for tracking events
 */
export function getLogger() {
  return logs.getLogger("kb-admin-server", "1.0.0");
}

/**
 * Get the default tracer for creating custom spans
 */
export function getTracer() {
  return trace.getTracer("kb-admin-server", "1.0.0");
}

/**
 * Track a custom event on the server-side
 *
 * IMPORTANT: In OpenTelemetry/Application Insights, custom events are logged as:
 * - Traces in the "traces" table with severityLevel = 1 (Information)
 * - Look for them in Application Insights > Logs > traces table
 * - Filter by customDimensions.event_name or severityText
 *
 * @param name - The name of the event
 * @param properties - Custom properties to include with the event
 */
export function trackServerEvent(
  name: string,
  properties?: TelemetryProperties,
) {
  const tracer = getTracer();
  const logger = getLogger();

  // Method 1: Use logger to emit a log record (appears as trace in App Insights)
  logger.emit({
    severityNumber: 9, // INFO level
    severityText: "INFO",
    body: `CustomEvent: ${name}`,
    attributes: {
      "event.name": name,
      "event.type": "custom",
      ...properties,
    },
  });

  // Method 2: Create a span with event (appears as dependency/trace in App Insights)
  const span = tracer.startSpan(`Event: ${name}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      "event.name": name,
      "event.type": "custom",
      ...properties,
    },
  });

  // Add event to span
  span.addEvent(name, {
    ...properties,
  });

  span.end();

  // Also log to console for debugging
  console.log(`[Telemetry] Event tracked: ${name}`, properties);
}

/**
 * Track a custom metric on the server-side
 * @param name - The name of the metric
 * @param value - The metric value
 * @param properties - Custom properties to include
 */
export function trackServerMetric(
  name: string,
  value: number,
  properties?: TelemetryProperties,
) {
  const tracer = getTracer();
  const span = tracer.startSpan(`metric:${name}`, {
    attributes: {
      "metric.name": name,
      "metric.value": value,
      ...properties,
    },
  });
  span.end();
}

/**
 * Track a server-side exception
 *
 * IMPORTANT: For exceptions to appear in the Application Insights "exceptions" table:
 * 1. They should be recorded on an active HTTP request span (SpanKind.SERVER)
 * 2. If no active span exists, this creates a SERVER span for proper tracking
 *
 * Usage in API routes (best - automatically uses active request span):
 *   try { ... } catch (error) { trackServerException(error); }
 *
 * The exception will be visible in:
 * - Application Insights > Failures > Exceptions
 * - The "exceptions" table in Logs (Analytics)
 * - The "traces" table as an ERROR log entry
 *
 * @param error - The error object
 * @param properties - Custom properties to include
 */
export function trackServerException(
  error: Error,
  properties?: TelemetryProperties,
) {
  const logger = getLogger();

  // Method 1: Log as error (appears in traces table)
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

  // Method 2: Record exception on a span (for exceptions table)
  // Try to get the active span from current context (from HTTP request)
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    // Record exception on the active request span
    // This properly populates the exceptions table in Application Insights
    activeSpan.recordException(error);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    // Add custom properties to the span
    if (properties) {
      activeSpan.setAttributes(properties);
    }

    console.error(
      `[Telemetry] Exception recorded on active span: ${error.name}: ${error.message}`,
      properties,
    );
  } else {
    // No active span - create a SERVER span for proper exception tracking
    // SpanKind.SERVER is crucial for Azure Monitor to map to exceptions table
    const tracer = getTracer();
    const span = tracer.startSpan(`Exception: ${error.name}`, {
      kind: SpanKind.SERVER, // SERVER kind ensures proper exception mapping
      attributes: {
        "exception.type": error.name,
        "exception.message": error.message,
        "exception.escaped": "true", // Not in request context
        ...properties,
      },
    });

    // Record the exception - this makes it appear in the exceptions table
    span.recordException(error);

    // Set error status
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    span.end();

    // Also log to console for immediate visibility
    console.error(
      `[Telemetry] Exception tracked with SERVER span: ${error.name}: ${error.message}`,
      properties,
    );
  }
}

/**
 * Create a custom span for tracking an operation
 * @param name - The name of the operation
 * @param fn - The async function to execute within the span
 * @param attributes - Custom attributes to include
 */
export async function withServerSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: TelemetryProperties,
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    attributes: attributes || {},
  });

  try {
    // Execute the function within the span context
    const result = await context.with(
      trace.setSpan(context.active(), span),
      () => fn(span),
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    // Record the error and set span status
    if (error instanceof Error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Track a database query
 * @param operation - The database operation (e.g., 'SELECT', 'INSERT', 'UPDATE')
 * @param table - The table name
 * @param duration - Query duration in milliseconds
 * @param success - Whether the query was successful
 */
export function trackDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  additionalProperties?: TelemetryProperties,
) {
  const tracer = getTracer();
  const span = tracer.startSpan(`db:${operation}`, {
    attributes: {
      "db.operation": operation,
      "db.table": table,
      "db.duration_ms": duration,
      "db.success": success,
      ...additionalProperties,
    },
  });
  span.setStatus({
    code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
  });
  span.end();
}

/**
 * Track an external API call
 * @param method - HTTP method
 * @param url - The API URL
 * @param duration - Request duration in milliseconds
 * @param statusCode - HTTP status code
 * @param success - Whether the call was successful
 */
export function trackApiCall(
  method: string,
  url: string,
  duration: number,
  statusCode: number,
  success: boolean,
  additionalProperties?: TelemetryProperties,
) {
  const tracer = getTracer();
  const span = tracer.startSpan(`api:${method}`, {
    attributes: {
      "http.method": method,
      "http.url": url,
      "http.status_code": statusCode,
      "http.duration_ms": duration,
      "http.success": success,
      ...additionalProperties,
    },
  });
  span.setStatus({
    code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
  });
  span.end();
}

/**
 * Higher-order function to wrap a server action with telemetry
 * @param name - The name of the server action
 * @param fn - The server action function
 * @returns Wrapped server action with automatic telemetry
 */
export function withTelemetry<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return withServerSpan(
      `server-action:${name}`,
      async (span) => {
        try {
          const result = await fn(...args);
          span.setAttribute("action.success", true);
          return result;
        } catch (error) {
          span.setAttribute("action.success", false);
          if (error instanceof Error) {
            span.setAttribute("action.error", error.message);
          }
          throw error;
        }
      },
      {
        "action.name": name,
      },
    );
  };
}

/**
 * Track user authentication events
 * @param event - The authentication event (e.g., 'login', 'logout', 'signup')
 * @param userId - The user ID
 * @param success - Whether the authentication was successful
 */
export function trackAuthEvent(
  event: "login" | "logout" | "signup" | "password-reset",
  userId: string,
  success: boolean,
  additionalProperties?: TelemetryProperties,
) {
  trackServerEvent(`auth:${event}`, {
    user_id: userId,
    success,
    ...additionalProperties,
  });
}

/**
 * Track a business event
 * @param eventType - The type of business event
 * @param properties - Custom properties
 */
export function trackBusinessEvent(
  eventType: string,
  properties?: TelemetryProperties,
) {
  trackServerEvent(`business:${eventType}`, properties);
}

/**
 * Track a custom trace message (similar to console.log but directly to App Insights)
 * Use this for logging important information that you want to ensure gets tracked
 *
 * @param message - The message to log
 * @param level - The severity level (info, warn, error, debug)
 * @param properties - Custom properties to include
 *
 * @example
 * trackTrace("User action completed", "info", { userId: "123", action: "login" });
 * trackTrace("API rate limit reached", "warn", { endpoint: "/api/data" });
 * trackTrace("Critical error occurred", "error", { errorCode: "500" });
 */
export function trackTrace(
  message: string,
  level: "info" | "warn" | "error" | "debug" = "info",
  properties?: TelemetryProperties,
) {
  const logger = getLogger();

  const severityMap = {
    debug: { number: 5, text: "DEBUG" },
    info: { number: 9, text: "INFO" },
    warn: { number: 13, text: "WARN" },
    error: { number: 17, text: "ERROR" },
  };

  const severity = severityMap[level];

  logger.emit({
    severityNumber: severity.number,
    severityText: severity.text,
    body: message,
    attributes: {
      "trace.level": level,
      ...properties,
    },
  });

  // Also log to console for immediate visibility
  const consoleMethod =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.log;
  consoleMethod(`[Telemetry Trace] ${message}`, properties || "");
}
