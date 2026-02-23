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
import type { AddRegularUserFormType } from "@/schema";
import { addRegularUserFormSchema } from "@/schema";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createRegularUserAction } from "@/actions/user-actions";

export default function AddUserForm({
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
    password: string;
  } | null>(null);

  const form = useForm<AddRegularUserFormType>({
    resolver: zodResolver(addRegularUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      securityNumber: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: AddRegularUserFormType) => {
    setIsSubmitting(true);
    setError(null);
    const newUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      securityNumber: data.securityNumber || "",
    };

    const result = await createRegularUserAction(newUserData);

    if (result.success) {
      toast.success("User created successfully");
      setCreatedUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      onSuccess?.();
    } else {
      setError(result.error || "Failed to create user");
    }
    setIsSubmitting(false);
  };

  if (createdUser) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold">User Created Successfully</h2>
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
              <span className="text-muted-foreground">Password:</span>
              <span className="font-medium font-mono">
                {createdUser.password}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please save these credentials securely. The password will not be
            shown again.
          </p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            type="button"
            onClick={() => {
              setCreatedUser(null);
              setOpen(false);
            }}
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
        <h2 className="text-lg font-bold">Add User</h2>
        <p className="text-sm text-muted-foreground">
          Create a new user account
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter email address"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter password (min 8 characters)"
                    className="bg-primary-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
