"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { UserWithStats } from "@/db/queries/user-queries";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface UserTableRowProps {
  readonly user: UserWithStats;
  readonly onEdit: (user: UserWithStats) => void;
  readonly onDelete: (user: UserWithStats) => void;
}

export default function UserTableRow({
  user,
  onEdit,
  onDelete,
}: Readonly<UserTableRowProps>) {
  return (
    <TableRow className="hover:bg-muted-foreground/20">
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.lastName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.securityNumber || "-"}</TableCell>
      <TableCell>
        {!user.invited && <span className="text-sm">Registered</span>}
        {user.invited && !user.invitationAccepted && (
          <span className="text-sm">
            Invited {new Date(user.createdAt).toLocaleDateString()}, not
            accepted
          </span>
        )}
        {user.invited &&
          user.invitationAccepted &&
          user.invitationAcceptedAt && (
            <span className="text-sm">
              Invited {new Date(user.createdAt).toLocaleDateString()}, accepted{" "}
              {new Date(user.invitationAcceptedAt).toLocaleDateString()}
            </span>
          )}
      </TableCell>
      <TableCell className="text-center">
        {user.chatTokenPurchasesCount}
      </TableCell>
      <TableCell className="text-center">{user.coursePurchasesCount}</TableCell>
      <TableCell className="text-center">
        {user.hasLicense ? "Yes" : "No"}
      </TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(user)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
