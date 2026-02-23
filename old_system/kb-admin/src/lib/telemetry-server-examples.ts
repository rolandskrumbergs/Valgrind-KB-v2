/**
 * Server-side Telemetry Usage Examples
 *
 * This file demonstrates how to use the server-side telemetry functions
 * in various scenarios throughout your Next.js application.
 */

import {
  trackServerEvent,
  trackServerMetric,
  trackServerException,
  withServerSpan,
  withTelemetry,
  trackDatabaseQuery,
  trackApiCall,
  trackAuthEvent,
  trackBusinessEvent,
} from "@/lib/telemetry-server";

// ============================================================================
// Example 1: Basic Event Tracking in Server Actions
// ============================================================================

export async function exampleBasicEventTracking() {
  "use server";

  // Track a simple event
  trackServerEvent("EmailSent", {
    recipient: "user@example.com",
    template: "welcome",
  });

  // Track an event with numeric measurements
  trackServerEvent("BatchProcessed", {
    batch_type: "user-import",
    status: "completed",
  });
}

// ============================================================================
// Example 2: Metric Tracking
// ============================================================================

export async function exampleMetricTracking() {
  "use server";

  const startTime = Date.now();

  // Simulate some work
  await processLargeDataset();

  const duration = Date.now() - startTime;

  // Track the processing time
  trackServerMetric("DatasetProcessingTime", duration, {
    dataset_size: "large",
    operation: "transformation",
  });

  // Track item count
  trackServerMetric("ProcessedItemCount", 1500, {
    item_type: "user-records",
  });
}

// ============================================================================
// Example 3: Exception Tracking
// ============================================================================

export async function exampleExceptionTracking(userId: string) {
  "use server";

  try {
    // Simulate an operation that might fail
    await performRiskyOperation(userId);
  } catch (error) {
    if (error instanceof Error) {
      // Track the exception with context
      trackServerException(error, {
        user_id: userId,
        operation: "performRiskyOperation",
        severity: "high",
        retry_attempted: false,
      });
    }

    // Re-throw or handle as needed
    throw error;
  }
}

// ============================================================================
// Example 4: Using Custom Spans
// ============================================================================

export async function exampleCustomSpan(customerId: string) {
  "use server";

  return withServerSpan(
    "fetch-customer-with-licenses",
    async (span) => {
      // Add custom attributes
      span.setAttribute("customer.id", customerId);

      // Fetch customer
      const customer = await fetchCustomer(customerId);
      span.setAttribute("customer.found", !!customer);

      if (customer) {
        // Fetch licenses
        const licenses = await fetchLicenses(customerId);
        span.setAttribute("licenses.count", licenses.length);
        span.setAttribute(
          "licenses.active",
          licenses.filter((l) => l.active).length,
        );

        return { customer, licenses };
      }

      return null;
    },
    {
      operation: "database",
      entity: "customer",
    },
  );
}

// ============================================================================
// Example 5: Wrapping Server Actions
// ============================================================================

// Automatically tracks execution time, success/failure, and errors
export const createNewCustomer = withTelemetry(
  "createNewCustomer",
  async (data: { name: string; email: string; companyName: string }) => {
    // Your business logic here
    const customer = await insertCustomer(data);

    // Track business event
    trackBusinessEvent("customer-created", {
      customer_id: customer.id,
      company_name: data.companyName,
      source: "admin-portal",
    });

    return customer;
  },
);

export const updateLicenseStatus = withTelemetry(
  "updateLicenseStatus",
  async (licenseId: string, status: string) => {
    const license = await updateLicense(licenseId, { status });

    trackBusinessEvent("license-status-changed", {
      license_id: licenseId,
      new_status: status,
      updated_at: new Date().toISOString(),
    });

    return license;
  },
);

// ============================================================================
// Example 6: Database Query Tracking
// ============================================================================

export async function exampleDatabaseTracking() {
  "use server";

  const startTime = Date.now();

  try {
    // Perform database query
    const users = await queryDatabase(
      "SELECT * FROM users WHERE active = true",
    );

    const duration = Date.now() - startTime;

    // Track successful query
    trackDatabaseQuery("SELECT", "users", duration, true, {
      row_count: users.length,
      filter: "active=true",
    });

    return users;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Track failed query
    trackDatabaseQuery("SELECT", "users", duration, false, {
      error_type: error instanceof Error ? error.name : "unknown",
    });

    throw error;
  }
}

// ============================================================================
// Example 7: External API Call Tracking
// ============================================================================

export async function exampleApiCallTracking(endpoint: string) {
  "use server";

  const startTime = Date.now();

  try {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    const duration = Date.now() - startTime;

    // Track the API call
    trackApiCall(
      "GET",
      `https://api.example.com/${endpoint}`,
      duration,
      response.status,
      response.ok,
      {
        endpoint: endpoint,
        service: "example-api",
        response_type: response.headers.get("content-type") || "unknown",
      },
    );

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    const duration = Date.now() - startTime;

    trackApiCall(
      "GET",
      `https://api.example.com/${endpoint}`,
      duration,
      0,
      false,
      {
        error: error instanceof Error ? error.message : "unknown",
      },
    );

    throw error;
  }
}

// ============================================================================
// Example 8: Authentication Event Tracking
// ============================================================================

export async function exampleLoginTracking(email: string, password: string) {
  "use server";

  try {
    const user = await authenticateUser(email, password);

    // Track successful login
    trackAuthEvent("login", user.id, true, {
      method: "email-password",
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    // Track failed login
    trackAuthEvent("login", email, false, {
      reason: "invalid-credentials",
      attempt_time: new Date().toISOString(),
    });

    throw error;
  }
}

export async function exampleLogoutTracking(userId: string) {
  "use server";

  // Perform logout
  await performLogout(userId);

  // Track logout
  trackAuthEvent("logout", userId, true, {
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// Example 9: Business Event Tracking
// ============================================================================

export async function exampleBusinessEventTracking() {
  "use server";

  // Track license purchase
  trackBusinessEvent("license-purchased", {
    customer_id: "cust-123",
    license_type: "enterprise",
    quantity: 100,
    total_amount: 9999,
    currency: "USD",
  });

  // Track feature usage
  trackBusinessEvent("feature-accessed", {
    feature_name: "knowledge-base-editor",
    user_id: "user-456",
    access_time: new Date().toISOString(),
  });

  // Track export operation
  trackBusinessEvent("data-exported", {
    export_type: "customers",
    record_count: 250,
    format: "csv",
    user_id: "user-789",
  });
}

// ============================================================================
// Example 10: Comprehensive Server Action with Multiple Tracking
// ============================================================================

export const processCustomerOrder = withTelemetry(
  "processCustomerOrder",
  async (orderId: string) => {
    return withServerSpan("process-customer-order", async (span) => {
      try {
        // Add span attributes
        span.setAttribute("order.id", orderId);

        // Step 1: Fetch order
        const order = await fetchOrder(orderId);
        span.setAttribute("order.amount", order.amount);
        span.setAttribute("order.customer_id", order.customerId);

        // Step 2: Validate payment
        const paymentValid = await validatePayment(order.paymentId);
        span.setAttribute("payment.valid", paymentValid);

        if (!paymentValid) {
          trackServerEvent("PaymentValidationFailed", {
            order_id: orderId,
            payment_id: order.paymentId,
          });
          throw new Error("Payment validation failed");
        }

        // Step 3: Create licenses
        const licenses = await createLicenses(order);
        span.setAttribute("licenses.created", licenses.length);

        // Step 4: Send confirmation email
        const emailStartTime = Date.now();
        await sendConfirmationEmail(order);
        const emailDuration = Date.now() - emailStartTime;

        trackServerMetric("EmailDeliveryTime", emailDuration, {
          email_type: "order-confirmation",
        });

        // Track business event
        trackBusinessEvent("order-processed", {
          order_id: orderId,
          customer_id: order.customerId,
          amount: order.amount,
          license_count: licenses.length,
        });

        span.setAttribute("result", "success");

        return { success: true, licenses };
      } catch (error) {
        span.setAttribute("result", "failure");

        if (error instanceof Error) {
          trackServerException(error, {
            operation: "process-customer-order",
            order_id: orderId,
          });
        }

        throw error;
      }
    });
  },
);

// ============================================================================
// Helper Functions (Mock implementations for examples)
// ============================================================================

async function processLargeDataset() {
  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function performRiskyOperation(userId: string) {
  // Mock implementation
  if (Math.random() > 0.5) {
    throw new Error("Simulated error");
  }
}

async function fetchCustomer(id: string) {
  // Mock implementation
  return { id, name: "Example Customer" };
}

async function fetchLicenses(customerId: string) {
  // Mock implementation
  return [{ id: "lic-1", active: true }];
}

async function insertCustomer(data: any) {
  // Mock implementation
  return { id: "cust-new", ...data };
}

async function updateLicense(id: string, data: any) {
  // Mock implementation
  return { id, ...data };
}

async function queryDatabase(query: string) {
  // Mock implementation
  return [];
}

async function authenticateUser(email: string, password: string) {
  // Mock implementation
  return { id: "user-123", email };
}

async function performLogout(userId: string) {
  // Mock implementation
}

async function fetchOrder(orderId: string) {
  // Mock implementation
  return {
    id: orderId,
    amount: 999,
    customerId: "cust-123",
    paymentId: "pay-456",
  };
}

async function validatePayment(paymentId: string) {
  // Mock implementation
  return true;
}

async function createLicenses(order: any) {
  // Mock implementation
  return [{ id: "lic-1" }, { id: "lic-2" }];
}

async function sendConfirmationEmail(order: any) {
  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
}
