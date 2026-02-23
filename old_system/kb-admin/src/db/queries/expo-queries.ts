import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { newsTable, chat, user, licensesTable } from "../schema";

export const getAllNews = async (userId: string) => {
  try {
    // Get all customer IDs from user's licenses
    const userLicenses = await db
      .select({ customerId: licensesTable.customerId })
      .from(licensesTable)
      .where(eq(licensesTable.userId, userId));

    const userCustomerIds = userLicenses.map((license) => license.customerId);

    // Fetch all published news
    const news = await db
      .select({
        id: newsTable.id,
        createdAt: newsTable.createdAt,
        title: newsTable.title,
        featuredImage: newsTable.featuredImage,
        status: newsTable.status,
        excludedCustomers: newsTable.excludedCustomers,
      })
      .from(newsTable)
      .where(eq(newsTable.status, "published"))
      .orderBy(desc(newsTable.createdAt));

    // Filter news based on user's licenses
    const filteredNews = news.filter((newsItem) => {
      const excludedCustomers = newsItem.excludedCustomers || [];

      // If no excluded customers, news is public - show to everyone
      if (excludedCustomers.length === 0) {
        return true;
      }

      // If user has no licenses, only show public news (already handled above)
      if (userCustomerIds.length === 0) {
        return false;
      }

      // Show news if at least one of user's customer IDs is NOT in excluded list
      return userCustomerIds.some(
        (customerId) => !excludedCustomers.includes(customerId),
      );
    });

    return filteredNews;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const getNewsById = async (id: string) => {
  try {
    const news = await db.select().from(newsTable).where(eq(newsTable.id, id));

    return news[0];
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
};

export const getChatsByUserId = async ({
  id,
  limit,
}: {
  id: string;
  limit: number;
}) => {
  try {
    return await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
      })
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
};

export const getAllChatsByUserId = async ({ id }: { id: string }) => {
  try {
    return await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
      })
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
};
