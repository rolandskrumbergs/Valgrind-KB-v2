"use server";

import { GetSessionInServer, CheckPermissionOfUser } from "./auth-action";
import type { UserRole } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getRegularUsersByLimitAndOffset,
  updateUser,
  getUserByEmail,
} from "@/db/queries/user-queries";
import { revalidatePath } from "next/cache";
import { withTelemetry } from "@/lib/telemetry-server";

interface APIError {
  statusCode: number;
  message: string;
  status?: string;
  body?: unknown;
}

export const getUserByEmailAction = withTelemetry(
  "getUserByEmailAction",
  async (email: string) => {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canViewUsers = await CheckPermissionOfUser(
      sessionData.user.id,
      "user",
      "list",
    );

    if (!canViewUsers.success) {
      return { error: "You do not have permission to view users" };
    }

    return getUserByEmail(email);
  },
);

export const getRegularUsersAction = withTelemetry(
  "getRegularUsersAction",
  async (page: number, pageSize: number) => {
    const sessionData = await GetSessionInServer();
    if (!sessionData) {
      return { error: "You are not logged in" };
    }

    const canViewUsers = await CheckPermissionOfUser(
      sessionData.user.id,
      "pages",
      "admin",
    );

    if (!canViewUsers.success) {
      return { error: "You do not have permission to view users" };
    }

    const offset = (page - 1) * pageSize;
    return getRegularUsersByLimitAndOffset(pageSize, offset);
  },
);

export const createRegularUserAction = withTelemetry(
  "createRegularUserAction",
  async (newUserData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    securityNumber: string;
  }) => {
    try {
      const sessionData = await GetSessionInServer();
      if (!sessionData) {
        return { error: "You are not logged in" };
      }

      const canCreateUser = await CheckPermissionOfUser(
        sessionData.user.id,
        "user",
        "create",
      );

      if (!canCreateUser.success) {
        return { error: "You do not have permission to create a new user" };
      }

      const response = await auth.api.createUser({
        body: {
          name: newUserData.firstName,
          email: newUserData.email,
          password: newUserData.password,
          role: "user" as UserRole,
        },
        headers: await headers(),
      });

      if (!response?.user?.id) {
        console.error("Failed to create user:", response);
        return { error: "Failed to create user", success: false };
      }

      await updateUser(response.user.id, {
        lastName: newUserData.lastName,
        securityNumber: newUserData.securityNumber,
        invited: false,
      });

      revalidatePath("/manage-users");
      return { success: true, data: response };
    } catch (error) {
      console.error("createRegularUserAction error:", error);
      const apiError = error as APIError;

      if (apiError.status === "BAD_REQUEST") {
        console.error("API Error details:", apiError);
        return { error: "Email already exists", success: false };
      }

      return {
        error: apiError.message || "Failed to create user",
        success: false,
      };
    }
  },
);

export const updateRegularUserAction = withTelemetry(
  "updateRegularUserAction",
  async (
    userId: string,
    updates: {
      name?: string;
      lastName?: string;
      securityNumber?: string;
      role?: UserRole;
    },
  ) => {
    try {
      const sessionData = await GetSessionInServer();
      if (!sessionData) {
        return { error: "You are not logged in", success: false };
      }

      const canUpdateUser = await CheckPermissionOfUser(
        sessionData.user.id,
        "pages",
        "admin",
      );

      if (!canUpdateUser.success) {
        return {
          error: "You do not have permission to update users",
          success: false,
        };
      }

      const result = await updateUser(userId, updates);

      if (!result.success) {
        return { error: result.error, success: false };
      }

      revalidatePath("/manage-users");
      return { success: true, data: result.data };
    } catch (error) {
      console.error("updateRegularUserAction error:", error);
      return { error: "An unexpected error occurred", success: false };
    }
  },
);

export const deleteRegularUserAction = withTelemetry(
  "deleteRegularUserAction",
  async (userId: string) => {
    try {
      const sessionData = await GetSessionInServer();
      if (!sessionData) {
        return { error: "You are not logged in", success: false };
      }

      const canDeleteUser = await CheckPermissionOfUser(
        sessionData.user.id,
        "pages",
        "admin",
      );

      if (!canDeleteUser.success) {
        return {
          error: "You do not have permission to delete users",
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

      revalidatePath("/manage-users");
      return { success: true };
    } catch (error) {
      console.error("deleteRegularUserAction error:", error);
      return { error: "Failed to delete user", success: false };
    }
  },
);
