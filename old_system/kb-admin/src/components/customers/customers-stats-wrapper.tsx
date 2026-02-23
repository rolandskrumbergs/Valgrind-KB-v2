import { getLicenseUsageStatsAction } from "@/actions/customer-actions";
import CustomersStats from "./customers-stats";

export async function CustomerStatsWrapper() {
  const stats = await getLicenseUsageStatsAction();

  if ("error" in stats) {
    return (
      <div className="h-full bg-muted rounded-lg p-4 gap-6 flex flex-col">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Info</h1>
          <p className="text-sm text-red-500">
            Error loading customer information.
          </p>
        </div>
      </div>
    );
  }

  return <CustomersStats initialStats={stats} />;
}
