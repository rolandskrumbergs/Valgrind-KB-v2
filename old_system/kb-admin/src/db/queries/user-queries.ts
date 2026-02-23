import { and, desc, eq, sql } from "drizzle-orm";

import { UserRole } from "@/lib/permissions";

import { db } from "..";
import { user, userCourses, licensesTable, customersTable } from "../schema";
import { Response } from "./course-queries";

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string | null;
  emailVerified: boolean;
  customerId: string | null;
  role: UserRole;
  image: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  username: string | null;
  displayUsername: string | null;
  purchasedChatTokens: number;
  securityNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  invited: boolean;
}

// --- GET ---
export const getUsers = async ({
  customerId,
  role = "user",
}: {
  customerId: string;
  role?: UserRole;
}): Promise<Response<User[]>> => {
  try {
    const users = await db.query.user.findMany({
      where: and(eq(user.customerId, customerId), eq(user.role, role)),
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error at [getUsers]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export async function getUserById<K extends Array<keyof User>>(
  id: string,
  fields?: K,
): Promise<Response<Pick<User, K[number]> | User | undefined>> {
  try {
    const columns =
      fields && fields.length > 0
        ? fields.reduce(
            (acc, field) => ({ ...acc, [field]: true as const }),
            {} as Record<string, true>,
          )
        : undefined;

    const entity = await db.query.user.findFirst({
      where: eq(user.id, id),
      ...(columns ? { columns } : {}),
    });

    return { success: true, data: entity as any };
  } catch (error) {
    console.error("Error at [getUserById]:", error);
    return { success: false, error: (error as Error).message } as any;
  }
}

export async function getUserByEmail(
  email: string,
): Promise<Response<User | undefined>> {
  try {
    const entity = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    return { success: true, data: entity };
  } catch (error) {
    console.error("Error at [getUserByEmail]:", error);
    return { success: false, error: (error as Error).message };
  }
}

export const getUserTotalTokensUsageForToday = async (
  userId: string,
): Promise<number> => {
  const {
    rows: [{ totalTokens }],
  } = (await db.execute(sql`
    SELECT COALESCE(SUM(total_tokens), 0) AS "totalTokens"
    FROM token_usage
    WHERE user_id = ${userId}
    AND DATE(created_at) = CURRENT_DATE
  `)) as unknown as { rows: { totalTokens: string }[] };

  return Number(totalTokens);
};

export const getUserChatTokensPurchasesCount = async (
  userId: string,
): Promise<number> => {
  const {
    rows: [{ count }],
  } = (await db.execute(sql`
    SELECT COUNT(*) AS "count"
    FROM chat_tokens_purchases
    WHERE user_id = ${userId}
  `)) as unknown as { rows: { count: string }[] };

  return Number(count);
};

export const getUserChatTokensPurchasesTotal = async (
  userId: string,
): Promise<number> => {
  const {
    rows: [{ total }],
  } = (await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0) AS "total"
    FROM chat_tokens_purchases
    WHERE user_id = ${userId}
  `)) as unknown as { rows: { total: string }[] };

  return Number(total);
};

// Get users by customer_id who have a license from that customer
// and do not have the given course
export const getAssignableUsersForCourse = async (
  customerId: string,
  courseId: number,
): Promise<Response<User[]>> => {
  try {
    const { rows } = (await db.execute(sql`
      SELECT u.*
      FROM "user" u
      INNER JOIN licenses l ON l.user_id = u.id AND l.customer_id = ${customerId}
      WHERE u.customer_id = ${customerId}
      AND NOT EXISTS (
        SELECT 1 FROM user_courses uc WHERE uc.user_id = u.id AND uc.course_id = ${courseId}
      )
    `)) as unknown as { rows: User[] };

    return { success: true, data: rows };
  } catch (error) {
    console.error("Error at [getAssignableUsersForCourse]:", error);
    return { success: false, error: (error as Error).message };
  }
};

// --- UPDATE ---

export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, "id">>,
): Promise<Response<User>> => {
  try {
    const data = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    if (!data?.length) {
      return { success: false, error: "User not found or not updated" };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error at [updateUser]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const updateUserAsInvitationAccepted = async (
  id: string,
): Promise<void> => {
  try {
    await db
      .update(user)
      .set({
        invitationAccepted: true,
        invitationAcceptedAt: new Date(),
      })
      .where(eq(user.id, id));
  } catch (error) {
    console.error("Error at [updateUserAsInvitationAccepted]:", error);
    throw error;
  }
};

export interface UserWithStats {
  id: string;
  name: string;
  lastName: string;
  email: string | null;
  securityNumber: string | null;
  invited: boolean;
  invitationAccepted: boolean;
  invitationAcceptedAt: Date | null;
  role: UserRole;
  createdAt: Date;
  chatTokenPurchasesCount: number;
  coursePurchasesCount: number;
  hasLicense: boolean;
  customerNames?: string[];
}

export const getRegularUsersByLimitAndOffset = async (
  limit: number,
  offset: number,
): Promise<{
  users: UserWithStats[];
  total: number;
}> => {
  try {
    // Get users with role "user"
    const users = await db.query.user.findMany({
      where: eq(user.role, "user"),
      limit,
      offset,
      orderBy: [desc(user.createdAt)],
      columns: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        securityNumber: true,
        invited: true,
        invitationAccepted: true,
        invitationAcceptedAt: true,
        role: true,
        createdAt: true,
        purchasedChatTokens: true,
      },
    });

    // Get statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        // Count chat token purchases (using purchasedChatTokens field)
        const chatTokenPurchasesCount = u.purchasedChatTokens || 0;

        // Count course purchases
        const coursePurchases = await db
          .select({ count: sql<number>`count(*)` })
          .from(userCourses)
          .where(
            and(
              eq(userCourses.userId, u.id),
              eq(userCourses.accessType, "purchase"),
            ),
          );

        // Check if user has an active license
        const licenseCheck = (await db.execute(sql`
          SELECT EXISTS(
            SELECT 1 FROM licenses WHERE user_id = ${u.id} AND activated = true
          ) AS "hasLicense"
        `)) as unknown as { rows: { hasLicense: boolean }[] };
        const hasLicense = licenseCheck.rows[0]?.hasLicense || false;

        // Get customer names for user's active licenses
        const userLicenses = await db
          .select({
            customerName: customersTable.name,
          })
          .from(licensesTable)
          .innerJoin(
            customersTable,
            eq(licensesTable.customerId, customersTable.id),
          )
          .where(
            and(
              eq(licensesTable.userId, u.id),
              eq(licensesTable.activated, true),
            ),
          );

        const customerNames = userLicenses.map((l) => l.customerName);

        return {
          id: u.id,
          name: u.name,
          lastName: u.lastName,
          email: u.email,
          securityNumber: u.securityNumber,
          invited: u.invited,
          invitationAccepted: u.invitationAccepted,
          invitationAcceptedAt: u.invitationAcceptedAt,
          role: u.role,
          createdAt: u.createdAt,
          chatTokenPurchasesCount,
          coursePurchasesCount: Number(coursePurchases[0].count),
          hasLicense,
          customerNames,
        };
      }),
    );

    // Get total count
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "user"));

    return {
      users: usersWithStats,
      total: Number(total[0].count),
    };
  } catch (error) {
    console.error("Error fetching regular users:", error);
    return {
      users: [],
      total: 0,
    };
  }
};
