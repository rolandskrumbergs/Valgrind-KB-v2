"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { AlertCircle, Trash2 } from "lucide-react";
import { deleteRegularUserAction } from "@/actions/user-actions";
import { toast } from "sonner";
import type { UserWithStats } from "@/db/queries/user-queries";

export default function DeleteUserDialog({
  user,
  setOpen,
}: Readonly<{
  user: UserWithStats;
  setOpen: (open: boolean) => void;
}>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteRegularUserAction(user.id);

    setIsDeleting(false);

    if (result.success) {
      toast.success("User deleted successfully");
      setOpen(false);
    } else {
      setError(result.error || "Failed to delete user");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20">
          <Trash2 className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Delete User</h2>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone
          </p>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-2">
        <p className="text-sm">Are you sure you want to delete this user?</p>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">
              {user.name} {user.lastName}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">{user.role}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-destructive/20 border border-destructive/50 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete User"}
        </Button>
      </div>
    </div>
  );
}
