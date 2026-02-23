"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { User } from "@/db/schema";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface AdminTableRowProps {
  readonly user: User;
  readonly onEdit: (user: User) => void;
  readonly onDelete: (user: User) => void;
}

export default function AdminTableRow({
  user,
  onEdit,
  onDelete,
}: Readonly<AdminTableRowProps>) {
  return (
    <TableRow className="hover:bg-muted-foreground/20">
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="secondary">{user.role}</Badge>
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
