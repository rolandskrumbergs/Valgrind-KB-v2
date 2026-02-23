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
import type { EditAdminFormType } from "@/schema";
import { editAdminFormSchema } from "@/schema";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { updateAdminUserAction } from "@/actions/admin-actions";
import type { User } from "@/db/schema";

export default function EditAdminForm({
  user,
  setOpen,
}: Readonly<{
  user: User;
  setOpen: (open: boolean) => void;
}>) {
  const form = useForm<EditAdminFormType>({
    resolver: zodResolver(editAdminFormSchema),
    defaultValues: {
      name: user.name,
      lastName: user.lastName || "",
      role: user.role as "admin" | "user",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: EditAdminFormType) => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateAdminUserAction(user.id, {
      name: data.name,
      lastName: data.lastName,
      role: data.role,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Admin updated successfully");
      setOpen(false);
    } else {
      setError(result.error || "Failed to update admin");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col border-b pb-4 border-white/5 p-4">
        <h2 className="text-lg font-bold">Edit Admin</h2>
        <p className="text-sm text-muted-foreground">
          Update admin information
        </p>
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
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    className="bg-primary-foreground"
                    {...field}
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
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    className="bg-primary-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 w-full items-center">
            {error && (
              <div className="text-red-500 text-sm bg-destructive/20 border border-destructive/50 px-2 h-9 rounded-lg whitespace-nowrap flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 w-full items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Admin"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
