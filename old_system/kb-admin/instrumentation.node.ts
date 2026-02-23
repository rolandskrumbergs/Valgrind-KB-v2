/**
 * Node.js-specific Instrumentation
 * This file is loaded only in the Node.js runtime (not edge)
 * Helps avoid Turbopack bundling issues with @azure/monitor-opentelemetry
 */

import { logs } from "@opentelemetry/api-logs";

// Store original console methods
let originalConsole: {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
} | null = null;

let consoleTrackingEnabled = false;

/**
 * Setup console tracking to send console.log/info/warn/error to Application Insights
 */
function setupConsoleTracking() {
  if (consoleTrackingEnabled) return;

  // Save original methods
  originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  const logger = logs.getLogger("console", "1.0.0");

  // Intercept console.log
  console.log = (...args: unknown[]) => {
    originalConsole!.log(...args);
    const message = args.map((arg) => formatArg(arg)).join(" ");
    logger.emit({
      severityNumber: 9, // INFO
      severityText: "INFO",
      body: message,
      attributes: {
        "console.method": "log",
      },
    });
  };

  // Intercept console.info
  console.info = (...args: unknown[]) => {
    originalConsole!.info(...args);
    const message = args.map((arg) => formatArg(arg)).join(" ");
    logger.emit({
      severityNumber: 9, // INFO
      severityText: "INFO",
      body: message,
      attributes: {
        "console.method": "info",
      },
    });
  };

  // Intercept console.warn
  console.warn = (...args: unknown[]) => {
    originalConsole!.warn(...args);
    const message = args.map((arg) => formatArg(arg)).join(" ");
    logger.emit({
      severityNumber: 13, // WARN
      severityText: "WARN",
      body: message,
      attributes: {
        "console.method": "warn",
      },
    });
  };

  // Intercept console.error
  console.error = (...args: unknown[]) => {
    originalConsole!.error(...args);
    const message = args.map((arg) => formatArg(arg)).join(" ");
    logger.emit({
      severityNumber: 17, // ERROR
      severityText: "ERROR",
      body: message,
      attributes: {
        "console.method": "error",
      },
    });
  };

  // Intercept console.debug
  console.debug = (...args: unknown[]) => {
    originalConsole!.debug(...args);
    const message = args.map((arg) => formatArg(arg)).join(" ");
    logger.emit({
      severityNumber: 5, // DEBUG
      severityText: "DEBUG",
      body: message,
      attributes: {
        "console.method": "debug",
      },
    });
  };

  consoleTrackingEnabled = true;
}

/**
 * Format console arguments for telemetry
 */
function formatArg(arg: unknown): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;

  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export async function register() {
  // Check if telemetry is disabled
  if (process.env.DISABLE_TELEMETRY === "true") {
    console.log(
      "ℹ️  Server-side telemetry is disabled via DISABLE_TELEMETRY env var",
    );
    return;
  }

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    console.warn(
      "⚠️  APPLICATIONINSIGHTS_CONNECTION_STRING not found. Server-side telemetry is disabled.",
    );
    return;
  }

  try {
    // Dynamic import to avoid issues with Turbopack
    const { useAzureMonitor } = await import("@azure/monitor-opentelemetry");

    // Initialize Azure Monitor with OpenTelemetry
    useAzureMonitor({
      azureMonitorExporterOptions: {
        connectionString,
      },
      samplingRatio: 1, // Track 100% of requests
      enableLiveMetrics: true,
      enableStandardMetrics: true,
      enableTraceBasedSamplingForLogs: false, // Ensure all logs are captured
      instrumentationOptions: {
        http: { enabled: true },
        azureSdk: { enabled: true },
        mongoDb: { enabled: false },
        mySql: { enabled: false },
        postgreSql: { enabled: true },
        redis: { enabled: false },
        redis4: { enabled: false },
        // Enable logging instrumentations for better event/exception tracking
        bunyan: { enabled: false },
        winston: { enabled: false },
      },
    });

    // Setup console tracking after OpenTelemetry is initialized
    setupConsoleTracking();

    console.log("✅ Azure Monitor OpenTelemetry initialized successfully");
    console.log("✅ Server-side console tracking enabled");
    console.log(
      "ℹ️  Console logs will appear in Application Insights > Logs > traces table",
    );
    console.log(
      "ℹ️  Custom events will appear in Application Insights > Logs > traces table",
    );
    console.log(
      "ℹ️  Exceptions will appear in Application Insights > Failures > Exceptions",
    );
  } catch (error) {
    console.error("❌ Failed to initialize server-side telemetry:");
    console.error(error);
    console.log("ℹ️  Application will continue without server-side telemetry");
    console.log("ℹ️  To disable this error, set DISABLE_TELEMETRY=true");
  }
}
