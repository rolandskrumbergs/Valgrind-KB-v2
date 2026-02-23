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
import type { AddAdminFormType } from "@/schema";
import { addAdminFormSchema } from "@/schema";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { CreateUserAction } from "@/actions/admin-actions";
import type { UserRole } from "@/lib/permissions";

export default function AddAdminForm({
  setOpen,
  onSuccess,
}: Readonly<{
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}>) {
  const [createdUser, setCreatedUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    password: string;
  } | null>(null);

  const form = useForm<AddAdminFormType>({
    resolver: zodResolver(addAdminFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: AddAdminFormType) => {
    setIsSubmitting(true);
    setError(null);
    const newUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: "admin" as UserRole,
      securityNumber: "",
      invited: false,
    } as const;

    const result = await CreateUserAction(newUserData);

    if (result.success) {
      toast.success("Admin created successfully");
      setCreatedUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: "admin" as UserRole,
        password: data.password,
      });
      onSuccess?.();
    } else {
      setError(result.error || "Failed to create admin");
    }
    setIsSubmitting(false);
  };

  if (createdUser) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold capitalize">
            {createdUser.role} Created Successfully
          </h2>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">First name:</span>
              <span className="font-medium">{createdUser.firstName}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Last name:</span>
              <span className="font-medium">{createdUser.lastName}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{createdUser.email}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{createdUser.role}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Password:</span>
              <span className="font-medium">{createdUser.password}</span>
            </div>
          </div>
          <div className="text-xs p-2 rounded-lg text-muted-foreground border border-dashed border-muted-foreground/50 mt-2">
            Please provide these credentials to the new {createdUser.role}.
          </div>
          <Button
            onClick={() => {
              setCreatedUser(null);
              form.reset();
              setOpen(false);
            }}
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col border-b pb-4 border-white/5 p-4">
        <h2 className="text-lg font-bold">Admin Details</h2>
        <p className="text-sm text-muted-foreground">
          Add a new admin to the system
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 bg-muted"
        >
          <FormField
            control={form.control}
            name="firstName"
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
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@example.com"
                    type="email"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input className="bg-primary-foreground" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-xs p-2 rounded-lg text-muted-foreground border border-dashed border-muted-foreground/50">
            Provide the email and password to the new admin, so they can login
            to the platform.
          </div>

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
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
