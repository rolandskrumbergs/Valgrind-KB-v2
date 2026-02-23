"use client";

import { AlertCircle, Badge, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import type { Customer } from "@/db/schema";
import { IndividualLicenseForm } from "./individual-add-user";
import { BulkUploadForm } from "./bulk-add-users";
import { cn } from "@/lib/utils";

const AddLicense = ({
  customer,
  usedLicenses,
}: {
  customer: Customer;
  usedLicenses: number;
}) => {
  const [openSingle, setOpenSingle] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);

  const availableLicenses = Math.max(0, customer.licenses - usedLicenses);
  const hasAvailableLicenses = availableLicenses > 0;

  return (
    <div className="h-fit bg-muted rounded-lg p-4 flex flex-row gap-4 items-center justify-between">
      <div className="flex flex-col gap-1 min-w-[180px]">
        <div
          className={cn(
            "text-xs rounded-lg px-2 py-1 w-fit flex items-center gap-1.5",
            hasAvailableLicenses
              ? "bg-muted text-muted-foreground"
              : "bg-destructive/50 text-destructive-foreground",
          )}
        >
          {hasAvailableLicenses ? (
            <Badge className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          Available licenses:{" "}
          <span className="font-bold">{availableLicenses}</span>
          <span>/</span>
          <span className="font-medium">{customer.licenses} total</span>
        </div>
        {!hasAvailableLicenses && (
          <p className="text-xs text-muted-foreground italic">
            Extend maximum licenses
          </p>
        )}
      </div>

      <div className="flex flex-row gap-2">
        <ResponsiveDialog
          open={openSingle}
          onOpenChange={setOpenSingle}
          trigger={
            <Button variant="default" size="sm" className="cursor-pointer">
              <Plus className="w-4 h-4" />
              Add Single License
            </Button>
          }
          title="Add License"
          description={`Add a new license to ${customer.name}`}
          className="sm:max-w-xl"
        >
          <IndividualLicenseForm
            setOpen={setOpenSingle}
            customer={customer}
            availableLicenses={availableLicenses}
          />
        </ResponsiveDialog>

        <ResponsiveDialog
          open={openBulk}
          onOpenChange={setOpenBulk}
          trigger={
            <Button variant="default" size="sm" className="cursor-pointer">
              <Plus className="w-4 h-4" />
              Add Bulk Licenses
            </Button>
          }
          title="Add Bulk Licenses"
          description={`Add multiple licenses to ${customer.name}`}
          className="sm:max-w-xl"
        >
          <BulkUploadForm
            setOpen={setOpenBulk}
            customer={customer}
            availableLicenses={availableLicenses}
          />
        </ResponsiveDialog>
      </div>
    </div>
  );
};

export default AddLicense;
