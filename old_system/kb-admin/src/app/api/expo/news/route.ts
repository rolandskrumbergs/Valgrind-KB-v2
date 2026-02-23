import { type NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/db/queries/user-queries";
import { getAllNews } from "@/db/queries/expo-queries";
import { getAllCustomers } from "@/db/queries/customer-queries";

interface TargetCustomer {
  id: string;
  name: string;
}

interface News {
  id: string;
  createdAt: Date;
  title: string;
  featuredImage: string | null;
  status: "published" | "draft";
  excludedCustomers: string[] | null;
}

interface NewsResponse extends News {
  targetCustomers: TargetCustomer[];
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header
    const userId = request.headers.get("User-ID");
    const count = request.headers.get("Count");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID not provided" },
        { status: 401 },
      );
    }

    const userData = await getUserById(userId);

    if (!userData) {
      return NextResponse.json(
        { error: "Unauthorized: User not found" },
        { status: 401 },
      );
    }

    const news: News[] = await getAllNews(userId);

    // If news is an error object, return it
    if (!Array.isArray(news)) {
      return NextResponse.json(news, { status: 400 });
    }

    // News is already filtered by licenses in getAllNews query
    const filteredNews = news;

    // Fetch all customers to build target customers list
    const allCustomers = await getAllCustomers();

    // Transform news items to include targetCustomers
    const newsResponse: NewsResponse[] = filteredNews.map((newsItem) => {
      // If no excluded customers, targetCustomers should be empty
      if (
        !newsItem.excludedCustomers ||
        newsItem.excludedCustomers.length === 0
      ) {
        return {
          ...newsItem,
          targetCustomers: [],
        };
      }

      // Filter out excluded customers from the list
      const targetCustomers: TargetCustomer[] = allCustomers
        .filter(
          (customer) => !newsItem.excludedCustomers!.includes(customer.id),
        )
        .map((customer) => ({
          id: customer.id,
          name: customer.name,
        }));

      return {
        ...newsItem,
        targetCustomers,
      };
    });

    if (count) {
      const parsedCount = Number.parseInt(count);
      if (Number.isNaN(parsedCount)) {
        return NextResponse.json(
          { error: "Invalid count parameter" },
          { status: 400 },
        );
      }
      newsResponse.splice(parsedCount);
    }

    return NextResponse.json({ news: newsResponse }, { status: 200 });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
