import { appInsights } from "@/services/appInsights";

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

export const initializeConsoleTracking = () => {
  // Wrap console.log
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    appInsights.trackTrace({
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
      severityLevel: 1, // Verbose
    });
  };

  // Wrap console.info
  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    appInsights.trackTrace({
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
      severityLevel: 1, // Information
    });
  };

  // Wrap console.warn
  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    appInsights.trackTrace({
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
      severityLevel: 2, // Warning
    });
  };

  // Wrap console.error
  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    appInsights.trackException({
      exception: new Error(
        args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg) : String(arg)
          )
          .join(" ")
      ),
      severityLevel: 3, // Error
    });
  };

  // Wrap console.debug
  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    appInsights.trackTrace({
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
      severityLevel: 0, // Verbose
    });
  };
};

// Optional: Restore original console methods
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
};
