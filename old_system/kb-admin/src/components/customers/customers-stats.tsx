"use client";

import React from "react";
import { useCustomerStats } from "@/hooks/customers/use-customer-stats";
import { Loader2 } from "lucide-react";

interface CustomerStatsData {
  totalCustomers: number;
  totalLicenses: number;
  usedLicenses: number;
  availableLicenses: number;
}

interface CustomerStatsProps {
  initialStats: CustomerStatsData;
}

const CustomersStats = ({ initialStats }: CustomerStatsProps) => {
  const { stats, isLoading, error } = useCustomerStats(initialStats);

  if (error) {
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

  return (
    <div className="h-full bg-muted rounded-lg p-4 flex flex-col">
      <div className="flex flex-col mb-4">
        <h1 className="text-xl font-semibold">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Customer and license overview
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col justify-center flex-1 gap-6">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">
              Total Customers
            </p>
            <h3 className="text-3xl font-bold mt-2">{stats.totalCustomers}</h3>
          </div>
          <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">
              Total Licenses
            </p>
            <h3 className="text-3xl font-bold mt-2">{stats.totalLicenses}</h3>
          </div>
          <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">
              Used Licenses
            </p>
            <h3 className="text-3xl font-bold mt-2">{stats.usedLicenses}</h3>
          </div>
          <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">
              Available Licenses
            </p>
            <h3 className="text-3xl font-bold mt-2">
              {stats.availableLicenses}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersStats;
