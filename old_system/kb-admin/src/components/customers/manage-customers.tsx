"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/customers/use-customers";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { ResponsiveDialog } from "../responsive-dialog";
import AddCustomerForm from "./add-customer-form";
import type { Customer } from "@/db/schema";

type SortField = "name" | "contactInfo" | "createdAt";
type SortDirection = "asc" | "desc";

interface ManageCustomersProps {
  initialCustomers: Customer[];
}

const ManageCustomers = ({ initialCustomers }: ManageCustomersProps) => {
  const { customers, isLoading, error, mutate } =
    useCustomers(initialCustomers);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.contactInfo.toLowerCase().includes(query)
    );
  });

  // Then sort the filtered results
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === "createdAt") {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }

    if (sortDirection === "asc") {
      return (aValue as string).localeCompare(bValue as string);
    }
    return (bValue as string).localeCompare(aValue as string);
  });

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Reload customers when dialog closes (after potentially adding a new customer)
    if (!newOpen) {
      mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <div className="text-center text-destructive">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-start flex-col">
          <h1 className="text-xl font-semibold">Manage Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customers in the system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="bg-background border border-input rounded-lg py-2 h-10 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <ResponsiveDialog
            open={open}
            onOpenChange={handleDialogChange}
            trigger={
              <Button
                variant="default"
                size="default"
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </Button>
            }
            title="Add Customer"
            description="Add a new customer to Ibben"
            className="sm:max-w-xl"
          >
            <AddCustomerForm setOpen={setOpen} />
          </ResponsiveDialog>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-5 bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center justify-between">
          <button
            type="button"
            onClick={() => handleSort("name")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground col-span-2"
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
            onClick={() => handleSort("contactInfo")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Contact Info
            {sortField === "contactInfo" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
          <div className="text-muted-foreground">Users/Licenses</div>
          <button
            type="button"
            onClick={() => handleSort("createdAt")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Created At
            {sortField === "createdAt" &&
              (sortDirection === "asc" ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              ))}
          </button>
        </div>
        <ScrollArea className="max-h-[calc(100dvh-14rem)] h-full rounded-b-md ">
          <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
            {sortedCustomers.length === 0 ? (
              <div className="p-4 text-center">
                {searchQuery
                  ? "No matching customers found"
                  : "No customers found"}
              </div>
            ) : (
              sortedCustomers.map((customer) => (
                <button
                  type="button"
                  key={customer.id}
                  className="w-full text-left cursor-pointer hover:bg-muted-foreground/20 grid grid-cols-5 p-3 items-center justify-between"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  aria-label={`View details for ${customer.name}`}
                >
                  <div className="col-span-2">{customer.name}</div>
                  <div>{customer.contactInfo}</div>
                  <div>
                    {customer.users}/{customer.licenses}
                  </div>
                  <div>{new Date(customer.createdAt).toLocaleDateString()}</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ManageCustomers;
