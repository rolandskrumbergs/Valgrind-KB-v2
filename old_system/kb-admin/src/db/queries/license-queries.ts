import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { db } from "..";
import {
  customersTable,
  licensesTable,
  user,
  userCourses,
  chat,
  message,
  userQuestionAnswers,
  account,
} from "../schema";

export const createLicense = async (data: {
  customerId: string;
  userId: string;
}) => {
  try {
    // Check if a revoked license exists for this user-customer combination
    const existingLicense = await db.query.licensesTable.findFirst({
      where: and(
        eq(licensesTable.userId, data.userId),
        eq(licensesTable.customerId, data.customerId),
        eq(licensesTable.activated, false),
      ),
    });

    // If a revoked license exists, reactivate it
    if (existingLicense) {
      const [reactivatedLicense] = await db
        .update(licensesTable)
        .set({
          activated: true,
          updatedAt: new Date(),
        })
        .where(eq(licensesTable.id, existingLicense.id))
        .returning();

      // Update customer users count
      await db
        .update(customersTable)
        .set({
          users: sql`${customersTable.users} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(customersTable.id, data.customerId));

      return reactivatedLicense;
    }

    // Otherwise, create a new license
    const [newLicense] = await db
      .insert(licensesTable)
      .values({
        customerId: data.customerId,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        activated: true,
      })
      .returning();

    // Update customer users count
    await db
      .update(customersTable)
      .set({
        users: sql`${customersTable.users} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(customersTable.id, data.customerId));

    return newLicense;
  } catch (error) {
    console.error("Error creating license:", error);
    return { error: "Failed to create license" };
  }
};

export const getLicenses = async (customerId: string, activated?: boolean) => {
  try {
    const whereClause =
      activated === undefined
        ? eq(licensesTable.customerId, customerId)
        : and(
            eq(licensesTable.customerId, customerId),
            eq(licensesTable.activated, activated),
          );

    const licenses = await db.query.licensesTable.findMany({
      where: whereClause,
      with: {
        user: true,
      },
      orderBy: [desc(licensesTable.createdAt)],
    });

    return licenses;
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return [];
  }
};

export const getLicenseByUserId = async (
  userId: string,
  customerId?: string,
) => {
  try {
    const whereClause = customerId
      ? and(
          eq(licensesTable.userId, userId),
          eq(licensesTable.customerId, customerId),
          eq(licensesTable.activated, true),
        )
      : and(
          eq(licensesTable.userId, userId),
          eq(licensesTable.activated, true),
        );

    const license = await db.query.licensesTable.findFirst({
      where: whereClause,
      with: {
        user: true,
        customer: true,
      },
    });

    return license;
  } catch (error) {
    console.error("Error fetching license by user ID:", error);
    return null;
  }
};

export const getUserCustomerLink = async (userId: string) => {
  try {
    const license = await db.query.licensesTable.findFirst({
      where: and(
        eq(licensesTable.userId, userId),
        eq(licensesTable.activated, true),
      ),
      with: {
        customer: true,
      },
    });

    return license;
  } catch (error) {
    console.error("Error fetching user-customer link:", error);
    return null;
  }
};

export const getCustomerUsers = async (customerId: string) => {
  try {
    const licenses = await db.query.licensesTable.findMany({
      where: (license) =>
        eq(license.customerId, customerId) && eq(license.activated, true),
      with: {
        user: true,
      },
      orderBy: [desc(licensesTable.createdAt)],
    });

    return licenses;
  } catch (error) {
    console.error("Error fetching customer users:", error);
    return [];
  }
};

export const checkUserExists = async (email: string) => {
  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    return existingUser;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return null;
  }
};

export const createMultipleLicenses = async (data: {
  customerId: string;
  userIds: string[];
}) => {
  try {
    // Check if any users are already linked to THIS customer (active or revoked)
    const existingLicenses = await db.query.licensesTable.findMany({
      where: and(
        inArray(licensesTable.userId, data.userIds),
        eq(licensesTable.customerId, data.customerId),
      ),
    });

    // Separate active and revoked licenses
    const activeLicenses = existingLicenses.filter((l) => l.activated);
    const revokedLicenses = existingLicenses.filter((l) => !l.activated);

    const activeUserIds = new Set(
      activeLicenses.map((license) => license.userId),
    );
    const revokedUserIds = new Set(
      revokedLicenses.map((license) => license.userId),
    );

    // Filter out users who already have active licenses
    const userIdsToProcess = data.userIds.filter(
      (userId) => !activeUserIds.has(userId),
    );

    // If no users to process, return the existing active licenses
    if (userIdsToProcess.length === 0) {
      return activeLicenses;
    }

    // Separate users who need new licenses from those who need reactivation
    const userIdsToReactivate = userIdsToProcess.filter((userId) =>
      revokedUserIds.has(userId),
    );
    const userIdsToCreate = userIdsToProcess.filter(
      (userId) => !revokedUserIds.has(userId),
    );

    const processedLicenses = [];

    // Reactivate revoked licenses
    if (userIdsToReactivate.length > 0) {
      const licensesToReactivate = revokedLicenses.filter((l) =>
        userIdsToReactivate.includes(l.userId!),
      );

      for (const license of licensesToReactivate) {
        const [reactivated] = await db
          .update(licensesTable)
          .set({
            activated: true,
            updatedAt: new Date(),
          })
          .where(eq(licensesTable.id, license.id))
          .returning();
        processedLicenses.push(reactivated);
      }
    }

    // Create new licenses
    if (userIdsToCreate.length > 0) {
      const newLicenses = await db
        .insert(licensesTable)
        .values(
          userIdsToCreate.map((userId) => ({
            customerId: data.customerId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            activated: true,
          })),
        )
        .returning();
      processedLicenses.push(...newLicenses);
    }

    // Update customer users count (only increment by the number of processed licenses)
    if (userIdsToProcess.length > 0) {
      await db
        .update(customersTable)
        .set({
          users: sql`${customersTable.users} + ${userIdsToProcess.length}`,
          updatedAt: new Date(),
        })
        .where(eq(customersTable.id, data.customerId));
    }

    return processedLicenses;
  } catch (error) {
    console.error("Error creating multiple licenses:", error);
    return { error: "Failed to create licenses" };
  }
};

// We remove user data from all tables, except:
// "licenses", "chat_token_purchases", "token_usage"
// and they are all connected through "userId"
export const revokeLicense = async (licenseId: string) => {
  try {
    // Find the license to revoke
    const license = await db.query.licensesTable.findFirst({
      where: eq(licensesTable.id, licenseId),
    });

    if (!license) {
      return { error: "License not found" };
    }

    if (!license.activated) {
      return { error: "License is already revoked" };
    }

    if (!license.userId) {
      return { error: "License is not linked to a user" };
    }

    // Revoke the license
    await db
      .update(licensesTable)
      .set({
        activated: false,
        updatedAt: new Date(),
      })
      .where(eq(licensesTable.id, licenseId));

    // Remove all chats and messages
    // 1. Find all chat IDs for this user
    const userChats = await db.query.chat.findMany({
      where: eq(chat.userId, license.userId),
      columns: { id: true },
    });
    const chatIds = userChats.map((c) => c.id);
    if (chatIds.length > 0) {
      // 2. Delete all messages in those chats
      await db.delete(message).where(inArray(message.chatId, chatIds));
      // 3. Delete all chats
      await db.delete(chat).where(inArray(chat.id, chatIds));
    }

    // Remove user_question_answers
    await db
      .delete(userQuestionAnswers)
      .where(eq(userQuestionAnswers.userId, license.userId));

    // Remove user_courses
    await db.delete(userCourses).where(eq(userCourses.userId, license.userId));

    // Remove accounts
    await db.delete(account).where(eq(account.userId, license.userId));

    // Note: We keep user personal information (name, lastName, email, etc.) intact
    // Only the license is revoked and related data is removed

    // Update customer users count
    await db
      .update(customersTable)
      .set({
        users: sql`${customersTable.users} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(customersTable.id, license.customerId));

    return { success: true };
  } catch (error) {
    console.error("Error revoking license:", error);
    return { error: "Failed to revoke license" };
  }
};

export const getUserLicensesWithCustomers = async (userId: string) => {
  try {
    const licenses = await db.query.licensesTable.findMany({
      where: and(
        eq(licensesTable.userId, userId),
        eq(licensesTable.activated, true),
      ),
      with: {
        customer: true,
      },
      orderBy: [desc(licensesTable.createdAt)],
    });

    return licenses;
  } catch (error) {
    console.error("Error fetching user licenses with customers:", error);
    return [];
  }
};
