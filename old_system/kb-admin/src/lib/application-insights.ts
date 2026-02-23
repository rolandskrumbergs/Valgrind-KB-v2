import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { env } from "./env";

let appInsights: ApplicationInsights | null = null;
let reactPlugin: ReactPlugin | null = null;
let originalConsole: {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
  debug: typeof console.debug;
} | null = null;

/**
 * Default filters for console messages that should not be sent to Application Insights
 * Messages containing any of these strings will be filtered out
 */
const DEFAULT_CONSOLE_FILTERS = [
  "[Fast Refresh]",
  "[HMR]",
  "[webpack-dev-server]",
  "[Turbopack]",
];

/**
 * Custom filters that can be added by the application
 */
let customConsoleFilters: string[] = [];

/**
 * Initialize Application Insights for the client-side
 * This should only be called once, typically in the root layout
 */
export function initializeAppInsights(): ApplicationInsights | null {
  // Only initialize on the client side
  if (globalThis.window === undefined) {
    return null;
  }

  // Only initialize if we have a connection string
  const connectionString =
    env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) {
    console.warn(
      "Application Insights connection string not found. Telemetry tracking is disabled.",
    );
    return null;
  }

  // Return existing instance if already initialized
  if (appInsights) {
    return appInsights;
  }

  try {
    // Initialize React plugin for better React component tracking
    reactPlugin = new ReactPlugin();

    appInsights = new ApplicationInsights({
      config: {
        connectionString,
        enableAutoRouteTracking: true, // Automatically track page views and route changes
        enableCorsCorrelation: true, // Enable CORS correlation for distributed tracing
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        enableAjaxErrorStatusText: true,
        enableUnhandledPromiseRejectionTracking: true,
        disableFetchTracking: false, // Track fetch requests
        excludeRequestFromAutoTrackingPatterns: [
          // Exclude specific patterns from auto-tracking if needed
          /\/api\/health/,
        ],
        extensions: [reactPlugin], // Add React plugin
      },
    });

    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Track the initial page view

    // Enable console tracking by default
    enableConsoleTracking();

    return appInsights;
  } catch (error) {
    console.error("Failed to initialize Application Insights:", error);
    return null;
  }
}

/**
 * Get the Application Insights instance
 */
export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

/**
 * Get the React Plugin instance
 * Useful for React-specific integrations like error boundaries
 */
export function getReactPlugin(): ReactPlugin | null {
  return reactPlugin;
}

/**
 * Track a custom event
 * @param name - The name of the event
 * @param properties - Custom properties to include with the event
 * @param measurements - Custom measurements (numeric values)
 */
export function trackEvent(
  name: string,
  properties?: { [key: string]: string },
  measurements?: { [key: string]: number },
) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.trackEvent({ name, properties, measurements }, properties);
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Track an exception
 * @param error - The error object
 * @param severityLevel - Optional severity level (0-4: Verbose, Information, Warning, Error, Critical)
 */
export function trackException(
  error: Error,
  severityLevel?: number,
  properties?: { [key: string]: string },
) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.trackException(
      {
        exception: error,
        severityLevel,
      },
      properties,
    );
  } catch (err) {
    console.error("Failed to track exception:", err);
  }
}

/**
 * Track a metric
 * @param name - The name of the metric
 * @param average - The metric value
 * @param properties - Custom properties to include
 */
export function trackMetric(
  name: string,
  average: number,
  properties?: { [key: string]: string },
) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.trackMetric({ name, average }, properties);
  } catch (error) {
    console.error("Failed to track metric:", error);
  }
}

/**
 * Track a page view
 * @param name - Optional page name
 * @param uri - Optional page URI
 */
export function trackPageView(name?: string, uri?: string) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.trackPageView({ name, uri });
  } catch (error) {
    console.error("Failed to track page view:", error);
  }
}

/**
 * Set the authenticated user context
 * @param userId - The user ID
 * @param accountId - Optional account ID
 */
export function setAuthenticatedUserContext(
  userId: string,
  accountId?: string,
) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.setAuthenticatedUserContext(userId, accountId, true);
  } catch (error) {
    console.error("Failed to set authenticated user context:", error);
  }
}

/**
 * Clear the authenticated user context
 */
export function clearAuthenticatedUserContext() {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.clearAuthenticatedUserContext();
  } catch (error) {
    console.error("Failed to clear authenticated user context:", error);
  }
}

/**
 * Flush any pending telemetry
 */
export function flushTelemetry() {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.flush();
  } catch (error) {
    console.error("Failed to flush telemetry:", error);
  }
}

/**
 * Track a dependency (external service call)
 * @param id - Unique identifier for the dependency
 * @param method - HTTP method or dependency type
 * @param absoluteUrl - The URL of the dependency
 * @param pathName - The path portion of the URL
 * @param totalTime - Total time taken in milliseconds
 * @param success - Whether the call was successful
 * @param resultCode - Response code or status
 */
export function trackDependency(
  id: string,
  method: string,
  absoluteUrl: string,
  pathName: string,
  totalTime: number,
  success: boolean,
  resultCode: number,
) {
  if (!appInsights) {
    return;
  }

  try {
    appInsights.trackDependencyData({
      id,
      target: absoluteUrl,
      name: pathName,
      duration: totalTime,
      success,
      responseCode: resultCode,
      type: method,
    });
  } catch (error) {
    console.error("Failed to track dependency:", error);
  }
}

/**
 * Check if a message should be filtered from Application Insights
 * @param message - The console message to check
 * @returns true if the message should be filtered (not tracked)
 */
function shouldFilterMessage(message: string): boolean {
  const allFilters = [...DEFAULT_CONSOLE_FILTERS, ...customConsoleFilters];
  return allFilters.some((filter) => message.includes(filter));
}

/**
 * Track a console message
 * @param level - The severity level (log, info, warn, error, debug)
 * @param message - The console message
 * @param args - Additional arguments passed to console
 */
export function trackTrace(
  level: "log" | "info" | "warn" | "error" | "debug",
  message: string,
  args?: unknown[],
) {
  if (!appInsights) {
    return;
  }

  // Filter out messages that match the filter criteria
  if (shouldFilterMessage(message)) {
    return;
  }

  try {
    // Map console levels to Application Insights severity levels
    const severityMap = {
      log: 1, // Information
      info: 1, // Information
      warn: 2, // Warning
      error: 3, // Error
      debug: 0, // Verbose
    };

    const properties: { [key: string]: string } = {
      consoleMethod: level,
      timestamp: new Date().toISOString(),
    };

    // Add additional arguments if provided
    if (args && args.length > 0) {
      properties.additionalArgs = JSON.stringify(args);
    }

    appInsights.trackTrace(
      {
        message,
        severityLevel: severityMap[level],
      },
      properties,
    );
  } catch (error) {
    // Use original console to avoid infinite loop
    if (originalConsole) {
      originalConsole.error("Failed to track trace:", error);
    }
  }
}

/**
 * Enable automatic console tracking
 * This will intercept console.log, console.warn, console.error, console.info, and console.debug
 * and send them to Application Insights while still logging to the console normally.
 */
export function enableConsoleTracking() {
  if (globalThis.window === undefined || !appInsights) {
    return;
  }

  // Only enable once
  if (originalConsole) {
    return;
  }

  try {
    // Store original console methods
    originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    // Helper function to format console arguments
    const formatArgs = (args: unknown[]): string => {
      return args
        .map((arg) => {
          if (typeof arg === "string") {
            return arg;
          }
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack}`;
          }
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");
    };

    // Intercept console.log
    console.log = (...args: unknown[]) => {
      originalConsole!.log(...args);
      const message = formatArgs(args);
      trackTrace("log", message, args.slice(1));
    };

    // Intercept console.info
    console.info = (...args: unknown[]) => {
      originalConsole!.info(...args);
      const message = formatArgs(args);
      trackTrace("info", message, args.slice(1));
    };

    // Intercept console.warn
    console.warn = (...args: unknown[]) => {
      originalConsole!.warn(...args);
      const message = formatArgs(args);
      trackTrace("warn", message, args.slice(1));
    };

    // Intercept console.error
    console.error = (...args: unknown[]) => {
      originalConsole!.error(...args);
      const message = formatArgs(args);

      // If the first argument is an Error object, track it as an exception
      if (args[0] instanceof Error) {
        trackException(args[0], 3, {
          source: "console.error",
          additionalArgs: args.length > 1 ? JSON.stringify(args.slice(1)) : "",
        });
      } else {
        trackTrace("error", message, args.slice(1));
      }
    };

    // Intercept console.debug
    console.debug = (...args: unknown[]) => {
      originalConsole!.debug(...args);
      const message = formatArgs(args);
      trackTrace("debug", message, args.slice(1));
    };
  } catch (error) {
    if (originalConsole) {
      originalConsole.error("Failed to enable console tracking:", error);
    }
  }
}

/**
 * Disable automatic console tracking and restore original console methods
 */
export function disableConsoleTracking() {
  if (!originalConsole) {
    return;
  }

  try {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    originalConsole = null;
  } catch (error) {
    console.error("Failed to disable console tracking:", error);
  }
}

/**
 * Add a custom filter to exclude console messages from being sent to Application Insights
 * @param filter - String to filter out (messages containing this text will not be tracked)
 * @example
 * addConsoleFilter("[My Custom Filter]");
 * addConsoleFilter("webpack");
 */
export function addConsoleFilter(filter: string) {
  if (!customConsoleFilters.includes(filter)) {
    customConsoleFilters.push(filter);
  }
}

/**
 * Add multiple custom filters at once
 * @param filters - Array of strings to filter out
 * @example
 * addConsoleFilters(["[My Filter]", "webpack", "HMR"]);
 */
export function addConsoleFilters(filters: string[]) {
  for (const filter of filters) {
    addConsoleFilter(filter);
  }
}

/**
 * Remove a custom filter
 * @param filter - The filter string to remove
 */
export function removeConsoleFilter(filter: string) {
  customConsoleFilters = customConsoleFilters.filter((f) => f !== filter);
}

/**
 * Clear all custom filters (default filters remain)
 */
export function clearCustomConsoleFilters() {
  customConsoleFilters = [];
}

/**
 * Get all active filters (both default and custom)
 * @returns Array of all active filter strings
 */
export function getActiveConsoleFilters(): string[] {
  return [...DEFAULT_CONSOLE_FILTERS, ...customConsoleFilters];
}

/**
 * Get only custom filters (excluding defaults)
 * @returns Array of custom filter strings
 */
export function getCustomConsoleFilters(): string[] {
  return [...customConsoleFilters];
}
