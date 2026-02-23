import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addUserFormSchema } from "@/schema";
import type { AddUserFormType } from "@/schema";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/db/schema";
import { useCreateUser } from "@/hooks/users/use-create-user";
import { useCreateIndividualLicense } from "@/hooks/licenses/use-create-individual-license";
import { DEFAULT_USER_PASSWORD } from "@/constants/cache-keys";
import { shareAllCustomerCoursesWithNewUsersAction } from "@/actions/courses-actions";
import { getUserByEmailAction } from "@/actions/user-actions";

export const IndividualLicenseForm = ({
  setOpen,
  customer,
  availableLicenses,
}: {
  setOpen: (open: boolean) => void;
  customer: Customer;
  availableLicenses: number;
}) => {
  const {
    createUser,
    isCreating: isCreatingUser,
    error: userError,
    createdUser: hookCreatedUser,
    resetState: resetUserState,
  } = useCreateUser();
  const {
    createLicense,
    isCreating: isCreatingLicense,
    error: licenseError,
    createdLicense,
    resetState: resetLicenseState,
  } = useCreateIndividualLicense();

  const [manualCreatedUser, setManualCreatedUser] = useState<any>(null);
  const createdUser = manualCreatedUser || hookCreatedUser;

  const form = useForm<AddUserFormType>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      personalNumber: "",
    },
  });

  const onSubmit = async (data: AddUserFormType) => {
    try {
      // Check if user already exists by email
      const existingUserResult = await getUserByEmailAction(data.email);

      let userId: string;
      let userWasCreated = false;

      // Check if result is an error response
      if ("error" in existingUserResult) {
        toast.error(existingUserResult.error);
        return;
      }

      if (existingUserResult.success && existingUserResult.data) {
        // User exists, use existing user ID
        userId = existingUserResult.data.id;

        // Set the created user for display purposes
        setManualCreatedUser({
          ...existingUserResult.data,
          name: existingUserResult.data.name,
          lastName: existingUserResult.data.lastName,
          email: existingUserResult.data.email || data.email,
          role: existingUserResult.data.role,
          securityNumber:
            existingUserResult.data.securityNumber || data.personalNumber,
        });
      } else {
        // User doesn't exist, create new user
        const userData = await createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: DEFAULT_USER_PASSWORD,
          role: "user", // Default role for new users
          securityNumber: data.personalNumber,
          customerId: customer.id,
          invited: true,
        });

        if (!userData) {
          return; // Error already handled by useCreateUser
        }

        userId = userData.id;
        userWasCreated = true;
      }

      // Create license to link user with customer (idempotent - returns existing if present)
      const licenseData = await createLicense(userId, customer.id);

      if (licenseData && !("error" in licenseData)) {
        if (userWasCreated) {
          toast.success("User created and linked to customer successfully");
          // Share all existing customer courses with the new user
          await shareAllCustomerCoursesWithNewUsersAction(customer.id, [
            userId,
          ]);
        } else {
          // User existed, license added successfully
          toast.success("License added to existing user successfully");
        }
      } else if (licenseData && "error" in licenseData) {
        const errorMsg =
          typeof licenseData.error === "string"
            ? licenseData.error
            : "Failed to create license";
        if (userWasCreated) {
          toast.warning(
            "User created but failed to link to customer: " + errorMsg,
          );
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process request",
      );
    }
  };

  if (createdUser) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold">
            {createdLicense
              ? "User Created and Linked Successfully"
              : "User Created Successfully"}
          </h2>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {createdUser.name} {createdUser.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{createdUser.email}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{createdUser.role}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Security Number:</span>
              <span className="font-medium">{createdUser.securityNumber}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Default Password:</span>
              <span className="font-medium">{DEFAULT_USER_PASSWORD}</span>
            </div>
            {createdLicense && (
              <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-muted-foreground">License Status:</span>
                <span className="font-medium text-green-700">
                  Linked to {customer.name}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              resetUserState();
              resetLicenseState();
              setManualCreatedUser(null);
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

  if (userError) {
    toast.error(userError);
  }

  if (licenseError) {
    toast.error(licenseError);
  }

  const hasAvailableLicenses = availableLicenses > 0;

  return (
    <div className="flex flex-col">
      <div className="flex flex-row border-b border-white/5 p-4 gap-2 items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold">Create New User</h2>
          <p className="text-sm text-muted-foreground">
            Create a new user for{" "}
            <span className="font-bold">{customer.name}</span>
          </p>
        </div>
        <div className="flex flex-col">
          <div
            className={`text-xs rounded-lg px-2 py-1 w-fit mt-1 flex items-center gap-1.5 ${
              hasAvailableLicenses
                ? "bg-muted text-muted-foreground"
                : "bg-destructive/50 text-destructive-foreground"
            }`}
          >
            {hasAvailableLicenses ? (
              <Badge className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            Available licenses:{" "}
            <span className="font-bold">{availableLicenses}</span>
            <span className="mx-0.5">/</span>
            <span className="font-medium">{customer.licenses} total</span>
          </div>
          {!hasAvailableLicenses && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              Extend maximum licenses
            </p>
          )}
        </div>
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
                    placeholder="First Name"
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Last Name"
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
                    type="email"
                    placeholder="Email"
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
            name="personalNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Personal Number (12 digits)"
                    className="bg-primary-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 w-full items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="cursor-pointer"
              disabled={
                isCreatingUser || isCreatingLicense || !hasAvailableLicenses
              }
            >
              {isCreatingUser
                ? "Creating User..."
                : isCreatingLicense
                  ? "Linking License..."
                  : "Create User"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
