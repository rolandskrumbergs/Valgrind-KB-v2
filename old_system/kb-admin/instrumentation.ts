/**
 * Next.js Instrumentation Hook
 *
 * This file runs before any other server code and initializes telemetry.
 * The Node.js-specific initialization is in instrumentation.node.ts to avoid
 * Turbopack bundling issues with @azure/monitor-opentelemetry.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid bundling issues with Turbopack
    const { register: registerNodeInstrumentation } = await import(
      "./instrumentation.node"
    );
    await registerNodeInstrumentation();
  }
}
