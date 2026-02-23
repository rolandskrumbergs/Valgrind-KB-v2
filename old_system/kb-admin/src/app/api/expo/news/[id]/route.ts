import { NextResponse } from "next/server";
import { getNewsById } from "@/db/queries/expo-queries";
import { getAllCustomers } from "@/db/queries/customer-queries";

interface TargetCustomer {
  id: string;
  name: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get params and await before using
    const { id: newsId } = await params;

    if (!newsId) {
      return NextResponse.json(
        { error: "Unauthorized: News ID not provided" },
        { status: 401 },
      );
    }

    const newsData = await getNewsById(newsId);

    if (!newsData) {
      return NextResponse.json(
        { error: "Unauthorized: News not found" },
        { status: 401 },
      );
    }

    // Fetch all customers to build target customers list
    const allCustomers = await getAllCustomers();

    // Add targetCustomers to the response
    let targetCustomers: TargetCustomer[] = [];

    // If no excluded customers, targetCustomers should be empty
    if (newsData.excludedCustomers && newsData.excludedCustomers.length > 0) {
      // Filter out excluded customers from the list
      targetCustomers = allCustomers
        .filter(
          (customer) => !newsData.excludedCustomers!.includes(customer.id),
        )
        .map((customer) => ({
          id: customer.id,
          name: customer.name,
        }));
    }

    const newsResponse = {
      ...newsData,
      targetCustomers,
    };

    return NextResponse.json({ news: newsResponse }, { status: 200 });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
