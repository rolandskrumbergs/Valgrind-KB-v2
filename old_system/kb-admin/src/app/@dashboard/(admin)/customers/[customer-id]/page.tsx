import { getCustomerByIdAction } from "@/actions/customer-actions";
import { getLicenses } from "@/db/queries/license-queries";

import EditCustomer from "@/components/customers/customer/edit-customer";
import CustomerStats from "@/components/customers/customer/customer-stats";
import ClientTabPanel from "@/components/customers/customer/tab-panel";

interface CustomerPageProps {
  params: Promise<{ "customer-id": string }>;
}

const CustomerPage = async ({ params }: CustomerPageProps) => {
  const { "customer-id": customerId } = await params;
  const customer = await getCustomerByIdAction(customerId);

  // Fetch licenses for this customer
  const licenses = await getLicenses(customerId);
  const activeLicenses = licenses.filter((l) => l.activated).length;
  const inactiveLicenses = licenses.length - activeLicenses;

  // Check if customer has an error
  if ("error" in customer) {
    return <div className="p-4 text-red-500">Error: {customer.error}</div>;
  }

  return (
    <div className="flex gap-2 h-full w-full">
      <div className="w-64 h-full flex-shrink-0 gap-2 flex flex-col">
        <EditCustomer customer={customer} />
        <CustomerStats
          customer={customer}
          activeLicenses={activeLicenses}
          inactiveLicenses={inactiveLicenses}
        />
      </div>
      <div className="flex-1 min-w-0 h-full">
        <ClientTabPanel customer={customer} usedLicenses={activeLicenses} />
      </div>
    </div>
  );
};

export default CustomerPage;
