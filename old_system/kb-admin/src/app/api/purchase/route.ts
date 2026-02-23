import { handlePurchaseWebhook } from "@/db/queries/course-queries";
import { trackServerEvent } from "@/lib/telemetry-server";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization");

  if (token !== process.env.REVENUECAT_WEBHOOK_AUTHORIZATION_TOKEN) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const data = await request.json();

  trackServerEvent("HandlePurchaseWebhookRequest", {
    ...data,
  });

  const result = await handlePurchaseWebhook(data);

  trackServerEvent("HandlePurchaseWebhookResponse", {
    ...result,
  });

  if (result.error) {
    return Response.json(result, { status: 500 });
  }

  return Response.json(result);
}
