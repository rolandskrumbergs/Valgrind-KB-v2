"use client";

import { useEffect } from "react";
import { initializeAppInsights } from "@/lib/application-insights";

export function AppInsightsProvider() {
  useEffect(() => {
    // Initialize Application Insights when the component mounts
    initializeAppInsights();
  }, []);

  return null;
}
