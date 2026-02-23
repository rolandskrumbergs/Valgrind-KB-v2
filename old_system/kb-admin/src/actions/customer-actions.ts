"use server";

import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getLicenseUsageStats,
  updateCustomer,
  deleteCustomer,
  getCustomersWithCourseInfo,
} from "@/db/queries/customer-queries";
import { revalidatePath } from "next/cache";
import type { AddCustomerFormType } from "@/schema";
import { CheckPermissionOfUser, GetSessionInServer } from "./auth-action";

export async function createCustomerAction(data: AddCustomerFormType) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canCreateUser = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "create",
  );

  if (!canCreateUser.success) {
    return { error: "You do not have permission to create a new user" };
  }

  const customer = await createCustomer({
    ...data,
  });

  if (!customer) {
    throw new Error("Failed to create customer");
  }

  // Revalidate the customers page to show the new customer
  revalidatePath("/customers");

  // Return the cache key to allow client components to revalidate
  return {
    success: true,
    customer,
  };
}

export async function getCustomersAction() {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canViewCustomers = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "read",
  );

  if (!canViewCustomers.success) {
    return { error: "You do not have permission to view customers" };
  }

  return getAllCustomers();
}

export async function getCustomerByIdAction(id: string) {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canViewCustomers = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "read",
  );

  if (!canViewCustomers.success) {
    return { error: "You do not have permission to view customers" };
  }

  const customer = await getCustomerById(id);

  if (!customer) {
    return { error: "Customer not found" };
  }

  return customer;
}

export async function getLicenseUsageStatsAction() {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canViewCustomers = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "read",
  );

  if (!canViewCustomers.success) {
    return { error: "You do not have permission to view license statistics" };
  }

  return getLicenseUsageStats();
}

export async function getCustomersWithCourseInfoAction(courseId: number) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canViewCustomers = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "read",
  );

  if (!canViewCustomers.success) {
    return { error: "You do not have permission to view customers" };
  }

  return getCustomersWithCourseInfo(courseId);
}

export async function updateCustomerAction(
  id: string,
  data: AddCustomerFormType,
) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canEditCustomer = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "update",
  );

  if (!canEditCustomer.success) {
    return { error: "You do not have permission to edit customers" };
  }

  try {
    const customer = await updateCustomer(id, {
      ...data,
    });

    // Revalidate the customers page to show the updated customer
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);

    return {
      success: true,
      customer,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update customer",
    };
  }
}

export async function deleteCustomerAction(customerId: string) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canDeleteCustomer = await CheckPermissionOfUser(
    sessionData.user.id,
    "customer",
    "delete",
  );

  if (!canDeleteCustomer.success) {
    return { error: "You do not have permission to delete customers" };
  }

  try {
    const deletedCustomer = await deleteCustomer(customerId);

    // Revalidate relevant paths
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return {
      success: true,
      customer: deletedCustomer,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete customer",
    };
  }
}
