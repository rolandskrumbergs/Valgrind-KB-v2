import React, { Suspense } from "react";
import { ManageCustomersWrapper } from "@/components/customers/manage-customers-wrapper";
import { ManageCustomersSkeleton } from "@/components/customers/manage-customers-skeleton";
import { CustomerStatsWrapper } from "@/components/customers/customers-stats-wrapper";
import { CustomerStatsSkeleton } from "@/components/customers/customers-stats-skeleton";

const CustomersPage = async () => {
  return (
    <div className="flex gap-2 h-full w-full">
      <div className="w-64 h-full flex-shrink-0">
        <Suspense fallback={<CustomerStatsSkeleton />}>
          <CustomerStatsWrapper />
        </Suspense>
      </div>
      <div className="flex-1 min-w-0">
        <Suspense fallback={<ManageCustomersSkeleton />}>
          <ManageCustomersWrapper />
        </Suspense>
      </div>
    </div>
  );
};

export default CustomersPage;
