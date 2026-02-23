"use client";

import { useState } from "react";

import AddLicense from "@/components/customers/customer/add-license";
import ManageLicenses from "@/components/customers/customer/manage-licenses";
import ViewCourses from "@/components/customers/customer/view-courses";

const ClientTabPanel = ({
  customer,
  usedLicenses,
}: {
  customer: any;
  usedLicenses: number;
}) => {
  const [tab, setTab] = useState(0);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex border-b mb-2">
        <button
          className={`px-4 py-2 cursor-pointer ${tab === 0 ? "border-b-2 border-green-500 font-bold" : "text-gray-500"}`}
          onClick={() => setTab(0)}
        >
          Licenses
        </button>
        <button
          className={`px-4 py-2 ml-2 cursor-pointer ${tab === 1 ? "border-b-2 border-green-500 font-bold" : "text-gray-500"}`}
          onClick={() => setTab(1)}
        >
          Courses
        </button>
      </div>
      <div className="flex-1">
        {tab === 0 && (
          <div className="flex flex-col gap-2">
            <AddLicense customer={customer} usedLicenses={usedLicenses} />
            <ManageLicenses customer={customer} />
          </div>
        )}
        {tab === 1 && <ViewCourses customerId={customer.id} />}
      </div>
    </div>
  );
};

export default ClientTabPanel;
