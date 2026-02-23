"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { getReactPlugin } from "@/lib/application-insights";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary with Application Insights React Plugin integration
 *
 * This component automatically tracks React component errors to Application Insights
 * using the React Plugin, which provides better error tracking including:
 * - Component stack traces
 * - Component names
 * - Props that caused the error
 * - React lifecycle information
 *
 * Usage:
 * ```tsx
 * <AppInsightsErrorBoundary>
 *   <YourApp />
 * </AppInsightsErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <AppInsightsErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <YourApp />
 * </AppInsightsErrorBoundary>
 * ```
 */
export class AppInsightsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error with React Plugin
    const reactPlugin = getReactPlugin();
    if (reactPlugin) {
      // The React Plugin automatically tracks component errors with rich context
      reactPlugin.trackException({
        exception: error,
        severityLevel: 4, // Critical
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            margin: "1rem",
          }}
        >
          <h2 style={{ color: "#c00" }}>Something went wrong</h2>
          <p style={{ color: "#666" }}>
            We&apos;re sorry for the inconvenience. This error has been
            reported.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              style={{
                marginTop: "1rem",
                textAlign: "left",
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "4px",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: "0.5rem",
                  overflow: "auto",
                  fontSize: "0.875rem",
                }}
              >
                {this.state.error.toString()}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => globalThis.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
