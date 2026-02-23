"use client";

import type { Customer } from "@/db/schema";

const CustomerStats = ({
  customer,
  activeLicenses,
  inactiveLicenses,
}: {
  customer: Customer;
  activeLicenses: number;
  inactiveLicenses: number;
}) => {
  return (
    <div className="space-y-2 w-full flex-1 h-full min-h-0">
      <div className="w-full bg-muted rounded-lg p-4 flex flex-col gap-4 h-full min-h-0 justify-evenly">
        <div className="flex flex-col items-center py-2">
          <p className="text-sm font-medium text-muted-foreground">
            Active Licenses
          </p>
          <h3 className="text-md font-bold mt-2">{activeLicenses}</h3>
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center py-2">
          <p className="text-sm font-medium text-muted-foreground">
            Revoked Licenses
          </p>
          <h3 className="text-md font-bold mt-2">{inactiveLicenses}</h3>
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center py-2">
          <p className="text-sm font-medium text-muted-foreground">
            Created at:
          </p>
          <h3 className="text-md font-bold mt-2">
            {customer.createdAt.toLocaleDateString()}
          </h3>
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center py-2">
          <p className="text-sm font-medium text-muted-foreground">
            Last updated:
          </p>
          <h3 className="text-md font-bold mt-2">
            {customer.updatedAt.toLocaleDateString()}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default CustomerStats;
