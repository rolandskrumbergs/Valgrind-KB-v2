import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Badge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkCreateUsers } from "@/hooks/customers/use-bulk-create-users";
import { Progress } from "@/components/ui/progress";
import type { Customer } from "@/db/schema";

export const BulkUploadForm = ({
  setOpen,
  customer,
  availableLicenses,
}: {
  setOpen: (open: boolean) => void;
  customer: Customer;
  availableLicenses: number;
}) => {
  const { data: session } = authClient.useSession();
  const [file, setFile] = useState<File | null>(null);
  const { bulkCreateUsers, isProcessing, error, result, resetState } =
    useBulkCreateUsers();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to upload users");
      return;
    }

    const uploadResult = await bulkCreateUsers(file, customer.id);

    if (uploadResult) {
      toast.success(
        `Users processed: ${uploadResult.created} created, ${uploadResult.linked} linked, ${uploadResult.skipped} skipped, ${uploadResult.errors.length} errors`,
      );
      if (uploadResult.errors.length > 0) {
        toast.error(`Some users failed to process. Check the results below.`);
      }
    }
  };

  const hasAvailableLicenses = availableLicenses > 0;

  return (
    <div className="flex flex-col">
      <div className="flex flex-row border-b border-white/5 p-4 gap-2 items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold">Bulk Upload Users</h2>
          <p className="text-sm text-muted-foreground pr-2">
            Upload a CSV file with users for:{" "}
            <span className="font-bold whitespace-nowrap">{customer.name}</span>
          </p>
        </div>
        <div className="flex flex-col">
          <div
            className={`text-xs whitespace-nowrap rounded-lg px-2 py-1 w-fit mt-1 flex items-center gap-1.5 ${
              hasAvailableLicenses
                ? "bg-muted text-muted-foreground"
                : "bg-destructive/50 text-destructive-foreground"
            }`}
          >
            {hasAvailableLicenses ? (
              <Badge className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            Available licenses:{" "}
            <span className="font-bold">{availableLicenses}</span>
            <span className="mx-0.5">/</span>
            <span className="font-medium">{customer.licenses} total</span>
          </div>
          {!hasAvailableLicenses && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              Extend maximum licenses
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 bg-muted">
        {!result && (
          <div className="flex flex-col gap-2">
            <p>CSV File</p>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="bg-primary-foreground"
                disabled={isProcessing}
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || isProcessing || !hasAvailableLicenses}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Upload"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV format: first name,last name,email,personal number,role
            </p>
            {!hasAvailableLicenses && (
              <p className="text-xs text-red-600 font-medium">
                ⚠️ No available licenses. Cannot create new users.
              </p>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">Processing users...</p>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700">
                Processing completed! Created: {result.created}, Linked:{" "}
                {result.linked}, Skipped: {result.skipped}, Errors:{" "}
                {result.errors.length}
              </p>
            </div>

            {result.created > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-blue-700">
                  {result.created} new user(s) created and linked to{" "}
                  {customer.name}
                </p>
              </div>
            )}

            {result.skipped > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-700">
                  {result.skipped} user(s) already exist and were skipped
                </p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-red-700">Errors:</p>
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs"
                    >
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-700">
                        {error.email}: {error.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 w-full items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetState();
                  setFile(null);
                }}
                className="cursor-pointer"
              >
                Upload Another File
              </Button>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {!result && !isProcessing && (
          <div className="flex justify-end gap-2 w-full items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
