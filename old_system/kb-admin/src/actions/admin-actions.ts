"use server";

import { GetSessionInServer, CheckPermissionOfUser } from "./auth-action";
import type { UserRole } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAdminUsersByLimitAndOffset } from "@/db/queries/admin-queries";
import { revalidatePath } from "next/cache";
import { updateUser } from "@/db/queries/user-queries";

interface APIError {
  statusCode: number;
  message: string;
  status?: string;
  body?: unknown;
}

export async function CreateUserAction(newUserData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  securityNumber: string;
  customerId?: string;
  invited: boolean;
}) {
  try {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canCreateUser = await CheckPermissionOfUser(
      sessionData.user.id,
      newUserData.role,
      "create",
    );

    if (!canCreateUser.success) {
      return { error: "You do not have permission to create a new user" };
    }

    const result = await CreateUser(
      newUserData.firstName,
      newUserData.lastName,
      newUserData.email,
      newUserData.password,
      newUserData.role,
      newUserData.securityNumber,
      newUserData.invited,
      newUserData.customerId,
    );

    if ("error" in result) {
      return { error: result.error, success: false };
    }
    revalidatePath("/manage-admins");
    return { success: true, data: result };
  } catch (error) {
    console.error("CreateUserAction error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function CreateUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: UserRole,
  securityNumber: string,
  invited: boolean,
  customerId?: string,
) {
  try {
    const response = await auth.api.createUser({
      body: {
        name: firstName,
        email,
        password,
        role,
      },
      headers: await headers(),
    });

    if (!response?.user?.id) {
      console.error("Failed to create user:", response);
      return { error: "Failed to create user", success: false };
    }

    await updateUser(response.user.id, {
      lastName,
      securityNumber,
      customerId,
      invited,
    });

    return response;
  } catch (error) {
    console.error("CreateUser error:", error);
    const apiError = error as APIError;

    // Check if the error is an API error with status and body
    if (apiError.status === "BAD_REQUEST") {
      console.error("API Error details:", apiError);
      return { error: "Email already exists", success: false };
    }

    return {
      error: apiError.message || "Failed to create user",
      success: false,
    };
  }
}

export async function getAdminUsersAction(page: number, pageSize: number) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "You are not logged in" };
  }

  const canViewAdmins = await CheckPermissionOfUser(
    sessionData.user.id,
    "pages",
    "admin",
  );

  if (!canViewAdmins.success) {
    return { error: "You do not have permission to view admins" };
  }

  const offset = (page - 1) * pageSize;
  return getAdminUsersByLimitAndOffset(pageSize, offset);
}

export async function updateAdminUserAction(
  userId: string,
  updates: {
    name?: string;
    lastName?: string;
    securityNumber?: string;
    role?: UserRole;
  },
) {
  try {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in", success: false };
    }

    const canUpdateAdmin = await CheckPermissionOfUser(
      sessionData.user.id,
      "pages",
      "admin",
    );

    if (!canUpdateAdmin.success) {
      return {
        error: "You do not have permission to update admins",
        success: false,
      };
    }

    const result = await updateUser(userId, updates);

    if (!result.success) {
      return { error: result.error, success: false };
    }

    revalidatePath("/manage-admins");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("updateAdminUserAction error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function deleteAdminUserAction(userId: string) {
  try {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in", success: false };
    }

    const canDeleteAdmin = await CheckPermissionOfUser(
      sessionData.user.id,
      "pages",
      "admin",
    );

    if (!canDeleteAdmin.success) {
      return {
        error: "You do not have permission to delete admins",
        success: false,
      };
    }

    // Delete user from database
    const { db } = await import("@/db");
    const { user, chat, message, vote } = await import("@/db/schema");
    const { eq, inArray } = await import("drizzle-orm");

    // First, get all chats for this user
    const userChats = await db.query.chat.findMany({
      where: eq(chat.userId, userId),
      columns: { id: true },
    });

    if (userChats.length > 0) {
      const chatIds = userChats.map((c) => c.id);

      // Get all messages for these chats
      const chatMessages = await db.query.message.findMany({
        where: inArray(message.chatId, chatIds),
        columns: { id: true },
      });

      if (chatMessages.length > 0) {
        const messageIds = chatMessages.map((m) => m.id);

        // Delete votes first (references messages)
        await db.delete(vote).where(inArray(vote.messageId, messageIds));
      }

      // Delete messages (references chat)
      await db.delete(message).where(inArray(message.chatId, chatIds));

      // Delete chats (references user)
      await db.delete(chat).where(inArray(chat.id, chatIds));
    }

    // Finally, delete the user
    await db.delete(user).where(eq(user.id, userId));

    revalidatePath("/manage-admins");
    return { success: true };
  } catch (error) {
    console.error("deleteAdminUserAction error:", error);
    return { error: "Failed to delete admin user", success: false };
  }
}
