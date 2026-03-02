import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/use-organizations";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { AddOrganizationForm } from "@/components/organizations/add-organization-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, ChevronUp, ChevronDown } from "lucide-react";

type SortField = "name" | "createdAt";
type SortDirection = "asc" | "desc";

export function OrganizationsPage() {
  const { organizations, isLoading, error, create } = useOrganizations();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      (org.contactInfo?.toLowerCase().includes(query) ?? false)
    );
  });

  const sortedOrganizations = [...filteredOrganizations].sort((a, b) => {
    if (sortField === "createdAt") {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return sortDirection === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-start flex-col">
          <h1 className="text-xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Manage organizations in the system
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
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                Add Organization
              </Button>
            }
            title="Add Organization"
            description="Add a new organization to the system"
            className="sm:max-w-xl"
          >
            <AddOrganizationForm setOpen={setOpen} onCreate={create} />
          </ResponsiveDialog>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-6 bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center justify-between">
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
          <div className="text-muted-foreground">Contact Info</div>
          <div className="text-muted-foreground">Seats</div>
          <div className="text-muted-foreground">Status</div>
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
        <ScrollArea className="max-h-[calc(100dvh-14rem)] h-full rounded-b-md">
          <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
            {sortedOrganizations.length === 0 ? (
              <div className="p-4 text-center">
                {searchQuery
                  ? "No matching organizations found"
                  : "No organizations found"}
              </div>
            ) : (
              sortedOrganizations.map((org) => (
                <button
                  type="button"
                  key={org.id}
                  className="w-full text-left cursor-pointer hover:bg-muted-foreground/20 grid grid-cols-6 p-3 items-center justify-between"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                  aria-label={`View details for ${org.name}`}
                >
                  <div className="col-span-2">{org.name}</div>
                  <div className="truncate">{org.contactInfo ?? "—"}</div>
                  <div>
                    {org.assignedSeats}/{org.maxSeats}
                  </div>
                  <div>
                    <Badge variant={org.isActive ? "default" : "secondary"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>{new Date(org.createdAt).toLocaleDateString()}</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
