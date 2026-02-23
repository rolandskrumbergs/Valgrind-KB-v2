"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationControls from "../customers/pagination-controls";
import type { User } from "@/db/schema";
import { getAdminUsersAction } from "@/actions/admin-actions";
import AdminTableRow from "./admin-table-row";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Plus, Search } from "lucide-react";
import { ResponsiveDialog } from "../responsive-dialog";
import AddAdminForm from "./add-admin-form";
import EditAdminForm from "./edit-admin-form";
import DeleteAdminDialog from "./delete-admin-dialog";

const limit = 20;

type ManageAdminProps = {
  page: number;
  initialUsers: User[];
  initialTotal: number;
};

const ManageAdmin = ({
  page,
  initialUsers,
  initialTotal,
}: ManageAdminProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await getAdminUsersAction(page, limit);

    if ("error" in result) {
      setError(result.error);
    } else {
      setUsers(result.users);
      setTotal(result.total);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Reload users when dialog closes (after potentially adding a new admin)
    if (!newOpen) {
      loadUsers();
    }
  };

  if (error) {
    return (
      <div className="h-fit w-full bg-muted rounded-lg p-4">
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-fit w-full bg-muted rounded-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Manage Admins</h1>
            <p className="text-sm text-muted-foreground">
              Manage admins and managers in the system
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
                placeholder="Search admins..."
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
                  Add Admin
                </Button>
              }
              title="Add Admin"
              description="Add a new admin to the system"
              className="sm:max-w-xl"
            >
              <AddAdminForm setOpen={setOpen} onSuccess={loadUsers} />
            </ResponsiveDialog>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted-foreground/20">
              <TableRow>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">
                  Admin Role
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Created At
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-muted-foreground/10">
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchQuery.trim()
                      ? "No admins match your search"
                      : "No users found"}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredUsers.length > 0 &&
                filteredUsers.map((user: User) => (
                  <AdminTableRow
                    key={user.id}
                    user={user}
                    onEdit={setEditUser}
                    onDelete={setDeleteUser}
                  />
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {total} users
            {searchQuery.trim() ? " (filtered)" : ""}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            path="/manage-admins"
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <ResponsiveDialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
            loadUsers();
          }
        }}
        title="Edit Admin"
        description="Update admin information"
        className="sm:max-w-xl"
      >
        {editUser && (
          <EditAdminForm
            user={editUser}
            setOpen={(open) => {
              if (!open) {
                setEditUser(null);
                loadUsers();
              }
            }}
          />
        )}
      </ResponsiveDialog>

      {/* Delete Dialog */}
      <ResponsiveDialog
        open={!!deleteUser}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUser(null);
            loadUsers();
          }
        }}
        title="Delete Admin"
        description="Confirm deletion"
        className="sm:max-w-lg"
      >
        {deleteUser && (
          <DeleteAdminDialog
            user={deleteUser}
            setOpen={(open) => {
              if (!open) {
                setDeleteUser(null);
                loadUsers();
              }
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
};

export default ManageAdmin;
