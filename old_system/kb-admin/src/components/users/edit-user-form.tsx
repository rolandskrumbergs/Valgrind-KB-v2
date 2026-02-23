"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import type { EditRegularUserFormType } from "@/schema";
import { editRegularUserFormSchema } from "@/schema";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { updateRegularUserAction } from "@/actions/user-actions";
import type { UserWithStats } from "@/db/queries/user-queries";

export default function EditUserForm({
  user,
  setOpen,
}: Readonly<{
  user: UserWithStats;
  setOpen: (open: boolean) => void;
}>) {
  const form = useForm<EditRegularUserFormType>({
    resolver: zodResolver(editRegularUserFormSchema),
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      securityNumber: user.securityNumber || "",
      role: user.role as "user" | "admin",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: EditRegularUserFormType) => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateRegularUserAction(user.id, {
      name: data.name,
      lastName: data.lastName,
      securityNumber: data.securityNumber,
      role: data.role,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("User updated successfully");
      setOpen(false);
    } else {
      setError(result.error || "Failed to update user");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col border-b pb-4 border-white/5 p-4">
        <h2 className="text-lg font-bold">Edit User</h2>
        <p className="text-sm text-muted-foreground">Update user information</p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 bg-muted"
        >
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-primary-foreground w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter first name"
                    className="bg-primary-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter last name"
                    className="bg-primary-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="securityNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Social Security Number{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter 12-digit security number"
                    className="bg-primary-foreground"
                    maxLength={12}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {user.customerNames && user.customerNames.length > 0 && (
            <div className="space-y-2">
              <FormLabel>Licensed Customers</FormLabel>
              <p className="text-xs text-muted-foreground">
                These are the customers this user has licenses for
              </p>
              <div className="flex flex-wrap gap-2">
                {user.customerNames.map((customerName) => (
                  <Badge key={customerName} variant="secondary" className="p-2 rounded-full">
                    {customerName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-destructive/20 border border-destructive/50 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
