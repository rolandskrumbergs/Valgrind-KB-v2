import { desc, eq, notInArray, and, isNotNull } from "drizzle-orm";
import { newsTable, licensesTable, user } from "../schema";
import { db } from "..";

/**
 * Get user IDs who should receive a news notification
 * If no customers are excluded, returns all users in the database
 * If customers are excluded, returns only users with licenses from non-excluded customers
 * @param excludedCustomerIds - Array of customer IDs to exclude
 * @returns Array of user IDs that should receive the notification
 */
export const getTargetUserIdsForNews = async (
  excludedCustomerIds: string[],
): Promise<string[]> => {
  try {
    // If no exclusions, get all users in the database
    if (!excludedCustomerIds || excludedCustomerIds.length === 0) {
      const users = await db.query.user.findMany({
        columns: {
          id: true,
        },
      });

      return users.map((u) => u.id);
    }

    // If there are exclusions, filter out licenses for excluded customers
    const licenses = await db.query.licensesTable.findMany({
      where: and(
        notInArray(licensesTable.customerId, excludedCustomerIds),
        isNotNull(licensesTable.userId),
      ),
      columns: {
        userId: true,
      },
    });

    // Extract unique user IDs (filter out null values)
    const userIds = Array.from(
      new Set(licenses.map((license) => license.userId).filter(Boolean)),
    ) as string[];

    return userIds;
  } catch (error) {
    console.error("Error fetching target user IDs for news:", error);
    return [];
  }
};

export const getAllNews = async () => {
  try {
    const news = await db.query.newsTable.findMany({
      orderBy: [desc(newsTable.createdAt)],
    });

    return news;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const getNewsById = async (id: string) => {
  try {
    const news = await db.query.newsTable.findFirst({
      where: eq(newsTable.id, id),
    });

    return news;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
};

export const updateNewsStatus = async (
  id: string,
  status: "published" | "draft",
) => {
  try {
    const result = await db
      .update(newsTable)
      .set({ status })
      .where(eq(newsTable.id, id))
      .returning();

    if (result && result.length > 0) {
      return { success: true, data: result[0] };
    }

    return { success: false, error: "News not found" };
  } catch (error) {
    console.error("Error updating news status:", error);
    return { success: false, error: error as string };
  }
};

export const deleteNews = async (id: string) => {
  try {
    await db.delete(newsTable).where(eq(newsTable.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting news:", error);
    return { success: false, error: error as string };
  }
};

export const updateNews = async (
  id: string,
  data: {
    title: string;
    content: string;
    featuredImage?: string | null;
    pdfFiles?: Array<{
      fileName: string;
      fileSize: number;
      s3Key: string;
      s3Url: string;
    }>;
    excludedCustomers?: string[];
  },
) => {
  try {
    const result = await db
      .update(newsTable)
      .set({
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage,
        pdfFiles: data.pdfFiles,
        excludedCustomers: data.excludedCustomers,
        updatedAt: new Date(),
      })
      .where(eq(newsTable.id, id))
      .returning();

    if (result && result.length > 0) {
      return { success: true, data: result[0] };
    }

    return { success: false, error: "News not found" };
  } catch (error) {
    console.error("Error updating news:", error);
    return { success: false, error: error as string };
  }
};
