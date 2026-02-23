import { getCustomersAction } from "@/actions/customer-actions";
import ManageCustomers from "./manage-customers";

export async function ManageCustomersWrapper() {
  const customers = await getCustomersAction();

  if ("error" in customers) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        <div className="text-center text-destructive">{customers.error}</div>
      </div>
    );
  }

  return <ManageCustomers initialCustomers={customers} />;
}
