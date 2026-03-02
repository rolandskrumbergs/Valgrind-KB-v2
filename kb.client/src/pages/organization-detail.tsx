import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrganization, useOrganizations } from "@/hooks/use-organizations";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { EditOrganizationForm } from "@/components/organizations/edit-organization-form";
import { AddSeatsForm } from "@/components/organizations/add-seats-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, UserMinus, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { organization, isLoading, error, reload } = useOrganization(id!);
  const { update } = useOrganizations();
  const {
    subscriptions,
    isLoading: subsLoading,
    error: subsError,
    createSeats,
    unassign,
    reload: reloadSubs,
  } = useSubscriptions(id!);

  const [editOpen, setEditOpen] = useState(false);
  const [addSeatsOpen, setAddSeatsOpen] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const handleUnassign = async (subscriptionId: string) => {
    setUnassigningId(subscriptionId);
    try {
      const result = await unassign(subscriptionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subscription unassigned successfully");
        await reload();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to unassign subscription"
      );
    } finally {
      setUnassigningId(null);
    }
  };

  const handleAddSeats = async (seats: number) => {
    const result = await createSeats(seats);
    if (result.error) {
      throw new Error(result.error);
    }
    await reload();
  };

  const handleUpdate = async (...args: Parameters<typeof update>) => {
    const result = await update(...args);
    if (!result.error) {
      await reload();
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <Link
          to="/organizations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
        <div className="text-center text-destructive">
          {error ?? "Organization not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          to="/organizations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
        <ResponsiveDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          trigger={
            <Button variant="default" size="default" className="cursor-pointer">
              <Building2 className="w-4 h-4" />
              Edit Organization
            </Button>
          }
          title="Edit Organization"
          description="Update organization details"
          className="sm:max-w-xl"
        >
          <EditOrganizationForm
            organization={organization}
            setOpen={(open) => {
              setEditOpen(open);
              if (!open) reload();
            }}
            onUpdate={handleUpdate}
          />
        </ResponsiveDialog>
      </div>

      {/* Organization Info Card */}
      <div className="bg-muted-foreground/10 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{organization.name}</h1>
          <Badge variant={organization.isActive ? "default" : "secondary"}>
            {organization.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Contact Info</span>
            <span className="font-medium">
              {organization.contactInfo ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Invoice Info</span>
            <span className="font-medium">
              {organization.invoiceInfo ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Seats</span>
            <span className="font-medium">
              {organization.assignedSeats} / {organization.maxSeats} assigned
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Created</span>
            <span className="font-medium">
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <ResponsiveDialog
          open={addSeatsOpen}
          onOpenChange={setAddSeatsOpen}
          trigger={
            <Button variant="default" size="default" className="cursor-pointer">
              <Plus className="w-4 h-4" />
              Add Seats
            </Button>
          }
          title="Add Seats"
          description="Add new subscription seats to this organization"
          className="sm:max-w-md"
        >
          <AddSeatsForm
            setOpen={(open) => {
              setAddSeatsOpen(open);
              if (!open) {
                reloadSubs();
                reload();
              }
            }}
            onSubmit={handleAddSeats}
          />
        </ResponsiveDialog>
      </div>

      {subsLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : subsError ? (
        <div className="text-center text-destructive p-4">{subsError}</div>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_0.6fr_0.8fr_80px] bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center">
            <div className="text-muted-foreground">User Email</div>
            <div className="text-muted-foreground">Status</div>
            <div className="text-muted-foreground">Assigned At</div>
            <div className="text-muted-foreground">Actions</div>
          </div>
          <ScrollArea className="max-h-[calc(100dvh-28rem)] h-full rounded-b-md">
            <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
              {subscriptions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No subscriptions yet
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_0.6fr_0.8fr_80px] px-3 py-3 items-center"
                  >
                    <div className="truncate">
                      {sub.userEmail ?? "Unassigned"}
                    </div>
                    <div>
                      <Badge
                        variant={sub.isAssigned ? "default" : "secondary"}
                      >
                        {sub.isAssigned ? "Assigned" : "Available"}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      {sub.assignedAt
                        ? new Date(sub.assignedAt).toLocaleDateString()
                        : "—"}
                    </div>
                    <div>
                      {sub.isAssigned && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-8 w-8"
                          disabled={unassigningId === sub.id}
                          onClick={() => handleUnassign(sub.id)}
                          aria-label={`Unassign ${sub.userEmail}`}
                        >
                          {unassigningId === sub.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
