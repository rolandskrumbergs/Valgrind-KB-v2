import { z } from "zod";
import type { UserRole } from "@/lib/permissions";

export const addAdminFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AddAdminFormType = z.infer<typeof addAdminFormSchema>;

export const editAdminFormSchema = z.object({
  name: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum<UserRole, [UserRole, UserRole]>(["admin", "user"], {
    required_error: "Please select a role",
  }),
});

export type EditAdminFormType = z.infer<typeof editAdminFormSchema>;

export const addCustomerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactInfo: z.string().min(5, "Contact info must be at least 5 characters"),
  invoiceInfo: z.string().min(5, "Invoice info must be at least 5 characters"),
  licenses: z.number().min(1, "Number of licenses must be at least 1"),
});

// Extension of the customer form schema with current used licenses validation
export const editCustomerFormSchema = (currentUsedLicenses: number) =>
  addCustomerFormSchema.extend({
    licenses: z
      .number()
      .min(1, "Number of licenses must be at least 1")
      .refine(
        (val) => val >= currentUsedLicenses,
        `License count cannot be lower than current usage (${currentUsedLicenses} licenses in use)`,
      ),
  });

export type AddCustomerFormType = z.infer<typeof addCustomerFormSchema>;
export type EditCustomerFormType = AddCustomerFormType;

export const addUserFormSchema = z.object({
  firstName: z.string().min(2, "Name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  personalNumber: z
    .string()
    .refine(
      (val) => val.length === 12,
      "Personal number must be exactly 12 digits",
    )
    .refine(
      (val) => /^\d{12}$/.test(val),
      "Personal number must contain only digits",
    ),
});

export type AddUserFormType = z.infer<typeof addUserFormSchema>;

export const addNewsFormSchema = z.object({
  title: z.string().min(1, "required"),
  content: z.string().min(1, "required"),
});

export type AddNewsFormType = z.infer<typeof addNewsFormSchema>;

export const addRegularUserFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  securityNumber: z
    .string()
    .refine(
      (val) => val.length === 12 || val.length === 0,
      "Security number must be exactly 12 digits or empty",
    )
    .refine(
      (val) => val.length === 0 || /^\d{12}$/.test(val),
      "Security number must contain only digits",
    )
    .optional(),
});

export type AddRegularUserFormType = z.infer<typeof addRegularUserFormSchema>;

export const editRegularUserFormSchema = z.object({
  name: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  securityNumber: z
    .string()
    .refine(
      (val) => val.length === 12 || val.length === 0,
      "Security number must be exactly 12 digits or empty",
    )
    .refine(
      (val) => val.length === 0 || /^\d{12}$/.test(val),
      "Security number must contain only digits",
    )
    .optional(),
  role: z.enum<UserRole, [UserRole, UserRole]>(["user", "admin"], {
    required_error: "Please select a role",
  }),
});

export type EditRegularUserFormType = z.infer<typeof editRegularUserFormSchema>;
