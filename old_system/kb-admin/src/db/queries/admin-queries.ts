import { desc, eq, sql } from "drizzle-orm";
import { db } from "..";
import { user } from "../schema";

export const getAdminUsersByLimitAndOffset = async (
  limit: number,
  offset: number,
) => {
  try {
    const users = await db.query.user.findMany({
      where: eq(user.role, "admin"),
      limit,
      offset,
      orderBy: [desc(user.createdAt)],
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "admin"));

    return {
      users,
      total: Number(total[0].count),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      users: [],
      total: 0,
    };
  }
};
