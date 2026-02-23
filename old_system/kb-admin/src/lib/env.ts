// Environment variables helper
// This file helps ensure environment variables are properly loaded

// Load environment variables from .env file in development
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Define environment variables with fallbacks
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  // AWS Configuration - server-side only
  AWS_REGION: process.env.AWS_REGION || "eu-north-1",
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || "",
  APP_AWS_ACCESS_KEY: process.env.APP_AWS_ACCESS_KEY || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  // SendGrid Configuration
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || "",
  SENDGRID_PASSWORD_RESET_FOR_INVITE_TEMPLATE_ID:
    process.env.SENDGRID_PASSWORD_RESET_FOR_INVITE_TEMPLATE_ID || "",
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID:
    process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || "",
  // Application Insights - client-side (must have NEXT_PUBLIC prefix)
  NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING:
    process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING || "",
  // Application Insights - server-side (no NEXT_PUBLIC prefix)
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || "",
  // Add other environment variables as needed
};

// Validate required environment variables
export function validateEnv() {
  const requiredEnvVars = [
    "DATABASE_URL",
    "AWS_BUCKET_NAME",
    "APP_AWS_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
    "SENDGRID_API_KEY",
    "SENDGRID_FROM_EMAIL",
    "SENDGRID_INVITATION_TEMPLATE_ID",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (key) => !env[key as keyof typeof env],
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    );
  }
}
