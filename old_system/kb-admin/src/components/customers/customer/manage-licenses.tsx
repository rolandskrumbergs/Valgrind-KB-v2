"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer } from "@/db/schema";
import { useLicense } from "@/hooks/licenses/use-licenses";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeLicenseAction } from "@/actions/license-actions";
import { toast } from "sonner";

type SortField = "name" | "email" | "personalNumber" | "createdAt";
type SortDirection = "asc" | "desc";

const ManageLicenses = ({ customer }: { customer: Customer }) => {
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { licenses, isLoading, error, mutate } = useLicense(customer.id);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // First filter by search query
  const filteredLicenses = licenses.filter((license) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      license.user?.name.toLowerCase().includes(query) ||
      license.user?.lastName.toLowerCase().includes(query) ||
      license.user?.email?.toLowerCase().includes(query) ||
      license.user?.securityNumber?.toString().includes(query)
    );
  });

  // Then sort the filtered results
  const sortedLicenses = [...filteredLicenses].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortField === "createdAt") {
      aValue = a.createdAt;
      bValue = b.createdAt;
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }

    // For user fields, access through license.user
    if (sortField === "name") {
      aValue = `${a.user?.name || ""} ${a.user?.lastName || ""}`.trim();
      bValue = `${b.user?.name || ""} ${b.user?.lastName || ""}`.trim();
    } else if (sortField === "email") {
      aValue = a.user?.email || "";
      bValue = b.user?.email || "";
    } else if (sortField === "personalNumber") {
      aValue = a.user?.securityNumber || "";
      bValue = b.user?.securityNumber || "";
    }

    if (sortDirection === "asc") {
      return (aValue as string).localeCompare(bValue as string);
    }
    return (bValue as string).localeCompare(aValue as string);
  });

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        <div className="text-center text-destructive">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg px-4 pb-4 flex flex-col col-span-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold leading-tight">User Licenses</h1>
          <p className="text-sm text-muted-foreground leading-tight">
            Manage user licenses for {customer.name}
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="bg-background border border-input rounded-lg py-2 h-9 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Search by name, email, personal number..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-[0.75fr_1fr_0.9fr_0.65fr_80px] bg-muted-foreground/20 px-2 h-10 border-b border-muted rounded-t-md items-center justify-between text-left">
          <button
            type="button"
            onClick={() => handleSort("name")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-start w-full"
          >
            Name
            {sortField === "name" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
          <button
            type="button"
            onClick={() => handleSort("email")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-start w-full"
          >
            Email
            {sortField === "email" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
          <button
            type="button"
            onClick={() => handleSort("personalNumber")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-center w-full"
          >
            Personal Number
            {sortField === "personalNumber" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
          <button
            type="button"
            onClick={() => handleSort("createdAt")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-center w-full"
          >
            Created At
            {sortField === "createdAt" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
          <div className="text-muted-foreground text-center">Actions</div>
        </div>
        <ScrollArea className="max-h-[calc(100dvh-14rem)] h-full rounded-b-md ">
          <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
            {sortedLicenses.length === 0 ? (
              <div className="p-4 text-center">
                {searchQuery
                  ? "No matching users found"
                  : "No user licenses found"}
              </div>
            ) : (
              sortedLicenses.map((license) => (
                <div
                  key={license.id}
                  className="w-full text-left grid grid-cols-[0.75fr_1fr_0.9fr_0.65fr_80px] p-2 items-center justify-between"
                >
                  <div className="w-full text-left">
                    {license.user?.name} {license.user?.lastName}
                  </div>
                  <div className="w-full text-left">{license.user?.email}</div>
                  <div className="w-full text-center">
                    {license.user?.securityNumber}
                  </div>
                  <div className="w-full text-center">
                    {new Date(license.createdAt).toLocaleDateString()}
                  </div>
                  <div className="w-full flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
                      onClick={() => {
                        setSelectedLicense(license);
                        setIsModalOpen(true);
                      }}
                      aria-label={`Revoke license for ${license.user?.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Modal for revoking license */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#242424] rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">Revoke License</h2>
              <p className="mb-4 text-[#737373]">
                Are you sure you want to revoke the license for:
                <span className="whitespace-nowrap font-semibold">
                  {" "}
                  {selectedLicense?.user?.name}{" "}
                  {selectedLicense?.user?.lastName}
                </span>
                ?
              </p>
              <div className="mb-6 text-sm text-muted-foreground bg-muted rounded">
                The user will remain in the system and can continue using the
                app without a license. Only the license assignment will be
                removed.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    const result = await revokeLicenseAction(
                      selectedLicense.id,
                    );
                    if ("error" in result) {
                      toast.error("Failed to revoke license: " + result.error);
                    } else {
                      toast.success("License revoked successfully");
                      setSelectedLicense(null);
                      setIsModalOpen(false);
                      mutate(); // Refresh table data after revocation
                    }
                  }}
                >
                  Revoke License
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLicenses;
