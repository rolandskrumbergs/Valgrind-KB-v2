/**
 * Test API Route for Server-Side Telemetry
 *
 * Test this endpoint to verify that telemetry is working:
 * GET /api/telemetry-test?action=event
 * GET /api/telemetry-test?action=exception
 * GET /api/telemetry-test?action=metric
 *
 * After calling these endpoints, check Application Insights:
 * - Events: Logs > traces table (filter by severityText = "INFO")
 * - Exceptions: Failures > Exceptions or Logs > exceptions table
 * - Metrics: Metrics Explorer
 */

import { NextRequest, NextResponse } from "next/server";
import {
  trackServerEvent,
  trackServerException,
  trackServerMetric,
} from "@/lib/telemetry-server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "event";

  try {
    switch (action) {
      case "event":
        // Test custom event tracking
        trackServerEvent("TestEvent", {
          test_type: "custom_event",
          timestamp: new Date().toISOString(),
          source: "telemetry-test-api",
        });

        return NextResponse.json({
          success: true,
          message: "Custom event tracked successfully",
          instructions: [
            "Check Application Insights > Logs",
            "Query: traces | where message contains 'CustomEvent: TestEvent'",
            "Or filter by customDimensions.event_name == 'TestEvent'",
          ],
        });

      case "exception": {
        // Test exception tracking
        const testError = new Error(
          "This is a test exception from telemetry test API",
        );
        testError.name = "TestException";

        trackServerException(testError, {
          test_type: "exception",
          severity: "info",
          source: "telemetry-test-api",
        });

        return NextResponse.json({
          success: true,
          message: "Exception tracked successfully",
          instructions: [
            "Check Application Insights > Failures > Exceptions",
            "Or Logs > exceptions table",
            "Query: exceptions | where type == 'TestException'",
          ],
        });
      }

      case "metric":
        // Test metric tracking
        trackServerMetric("TestMetric", 42, {
          test_type: "metric",
          unit: "count",
          source: "telemetry-test-api",
        });

        return NextResponse.json({
          success: true,
          message: "Metric tracked successfully",
          instructions: [
            "Check Application Insights > Logs > traces",
            "Query: traces | where message contains 'TestMetric'",
          ],
        });

      case "all": {
        // Test all tracking methods
        trackServerEvent("TestAllEvent", {
          test_type: "all",
          source: "telemetry-test-api",
        });

        const allTestError = new Error("Test exception for 'all' action");
        allTestError.name = "TestAllException";
        trackServerException(allTestError, {
          test_type: "all",
          source: "telemetry-test-api",
        });

        trackServerMetric("TestAllMetric", 100, {
          test_type: "all",
          source: "telemetry-test-api",
        });

        return NextResponse.json({
          success: true,
          message: "All telemetry types tracked successfully",
          instructions: [
            "Event: Check traces table for 'CustomEvent: TestAllEvent'",
            "Exception: Check exceptions table for 'TestAllException'",
            "Metric: Check traces table for 'TestAllMetric'",
          ],
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Invalid action parameter",
            validActions: ["event", "exception", "metric", "all"],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in telemetry test API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, properties } = body;

    if (!eventName) {
      return NextResponse.json(
        {
          success: false,
          message: "eventName is required",
        },
        { status: 400 },
      );
    }

    // Track custom event with provided name and properties
    trackServerEvent(eventName, {
      ...properties,
      source: "telemetry-test-api-post",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Event '${eventName}' tracked successfully`,
      instructions: [
        "Check Application Insights > Logs > traces",
        `Query: traces | where message contains 'CustomEvent: ${eventName}'`,
      ],
    });
  } catch (error) {
    console.error("Error in telemetry test POST API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
