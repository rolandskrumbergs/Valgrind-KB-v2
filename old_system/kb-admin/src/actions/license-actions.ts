"use server";

import {
  createLicense,
  getLicenses,
  revokeLicense,
} from "@/db/queries/license-queries";
import { revalidatePath } from "next/cache";
import { GetSessionInServer, CheckPermissionOfUser } from "./auth-action";
import { db } from "@/db";
import { customersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authClient } from "@/lib/auth-client";

export const createLicenseAction = async (
  userId: string | string[],
  customerId: string,
) => {
  try {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canReadCustomer = await CheckPermissionOfUser(
      sessionData.user.id,
      "customer",
      "read",
    );

    if (!canReadCustomer.success) {
      return { error: "You do not have permission to read customers" };
    }

    // Check if customer has available licenses
    const customer = await db.query.customersTable.findFirst({
      where: eq(customersTable.id, customerId),
    });

    if (!customer) {
      return { error: "Customer not found" };
    }

    // Convert single userId to array for consistent handling
    const userIds = Array.isArray(userId) ? userId : [userId];

    // Check if customer has enough available licenses
    const availableLicenses = customer.licenses - customer.users;
    if (userIds.length > availableLicenses) {
      return {
        error: `Cannot create ${userIds.length} licenses. Only ${availableLicenses} licenses available (${customer.users}/${customer.licenses}).`,
      };
    }

    // Handle single user
    if (userIds.length === 1) {
      // Check if user is already linked to this customer
      const { getLicenseByUserId } = await import(
        "@/db/queries/license-queries"
      );
      const existingLicense = await getLicenseByUserId(userIds[0], customerId);

      if (existingLicense) {
        // If license already exists for this customer, return error
        return { error: "User already has a license for this customer" };
      }

      const canCreateLicense = await CheckPermissionOfUser(
        sessionData.user.id,
        "licenses",
        "create",
      );

      if (!canCreateLicense.success) {
        return { error: "You do not have permission to create a new license" };
      }

      const license = await createLicense({
        userId: userIds[0],
        customerId,
      });

      if ("error" in license) {
        return { error: license.error };
      }

      // Get the created license with user information
      const { getLicenseByUserId: getLicenseWithUser } = await import(
        "@/db/queries/license-queries"
      );
      const licenseWithUser = await getLicenseWithUser(userIds[0]);

      // We are triggering a password reset email to the user
      // This works now as an invitation for the system.
      // Proper invitation flow can be implemented later.
      if (
        licenseWithUser &&
        !("error" in licenseWithUser) &&
        licenseWithUser.user?.email
      ) {
        await authClient.forgetPassword({
          email: licenseWithUser.user.email,
          redirectTo: `${process.env.BETTER_AUTH_FORGET_PASSWORD_URL}?id=${userId}`,
        });
      }

      revalidatePath("/customers/[id]", "page");
      return licenseWithUser;
    }

    const canCreateLicense = await CheckPermissionOfUser(
      sessionData.user.id,
      "licenses",
      "create",
    );

    if (!canCreateLicense.success) {
      return { error: "You do not have permission to create a new license" };
    }

    // Handle multiple users
    const { createMultipleLicenses, getCustomerUsers, getLicenseByUserId } =
      await import("@/db/queries/license-queries");
    const licenses = await createMultipleLicenses({
      userIds,
      customerId,
    });

    if ("error" in licenses) {
      return { error: licenses.error };
    }

    // Get the created licenses with user information and send emails
    const licensesWithUsers = await getCustomerUsers(customerId);

    // We are triggering a password reset email to the user
    // This works now as an invitation for the system.
    // Proper invitation flow can be implemented later.
    for (const userId of userIds) {
      const licenseWithUser = await getLicenseByUserId(userId);
      if (
        licenseWithUser &&
        !("error" in licenseWithUser) &&
        licenseWithUser.user?.email
      ) {
        await authClient.forgetPassword({
          email: licenseWithUser.user.email,
          redirectTo: `${process.env.BETTER_AUTH_FORGET_PASSWORD_URL}?id=${userId}`,
        });
      }
    }

    revalidatePath("/customers/[id]", "page");
    return licensesWithUsers;
  } catch (error) {
    console.error("Error in createLicenseAction:", error);
    return { error: "Failed to create license(s)" };
  }
};

export const getLicensesAction = async (customerId: string) => {
  try {
    const sessionData = await GetSessionInServer();

    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canReadLicense = await CheckPermissionOfUser(
      sessionData.user.id,
      "licenses",
      "read",
    );

    if (!canReadLicense.success) {
      return { error: "You do not have permission to read licenses" };
    }

    const result = await getLicenses(customerId, true);
    return result;
  } catch (error) {
    console.error("Error in getLicensesAction:", error);
    throw error;
  }
};

export const revokeLicenseAction = async (licenseId: string) => {
  try {
    const sessionData = await GetSessionInServer();

    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canRevokeLicense = await CheckPermissionOfUser(
      sessionData.user.id,
      "licenses",
      "delete",
    );

    if (!canRevokeLicense.success) {
      return { error: "You do not have permission to revoke this license" };
    }

    const result = await revokeLicense(licenseId);

    revalidatePath("/customers/[id]", "page");
    revalidatePath("/users", "page");
    return result;
  } catch (error) {
    console.error("Error in revokeLicenseAction:", error);
    return { error: "Failed to revoke license" };
  }
};
