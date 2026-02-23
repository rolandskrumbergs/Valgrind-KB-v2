import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "..";
import { customersTable, licensesTable } from "../schema";

export const createCustomer = async (data: {
  name: string;
  contactInfo: string;
  invoiceInfo: string;
  licenses: number;
}) => {
  try {
    const [customer] = await db.insert(customersTable).values(data).returning();
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    return null;
  }
};

export const getAllCustomers = async () => {
  try {
    const customers = await db.query.customersTable.findMany({
      orderBy: [desc(customersTable.createdAt)],
    });

    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

export const getCustomerById = async (id: string) => {
  try {
    const customer = await db.query.customersTable.findFirst({
      where: eq(customersTable.id, id),
    });

    if (!customer) {
      return null;
    }

    return customer;
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw error;
  }
};

export const getLicenseUsageStats = async () => {
  try {
    // Get all customers with their total licenses
    const customers = await db.query.customersTable.findMany({
      columns: {
        id: true,
        licenses: true,
      },
    });

    // Calculate total licenses allocated to all customers
    let totalLicenses = 0;
    for (const customer of customers) {
      totalLicenses += customer.licenses;
    }

    // Count total number of active licenses in use (rows in the licenses table where activated = true)
    const licensesCount = await db
      .select({ count: count() })
      .from(licensesTable)
      .where(eq(licensesTable.activated, true));

    const usedLicenses = Number(licensesCount[0].count);

    // Available licenses is total minus used
    const availableLicenses = Math.max(0, totalLicenses - usedLicenses);

    return {
      totalLicenses,
      usedLicenses,
      availableLicenses,
      totalCustomers: customers.length,
    };
  } catch (error) {
    console.error("Error calculating license usage stats:", error);
    return {
      totalLicenses: 0,
      usedLicenses: 0,
      availableLicenses: 0,
      totalCustomers: 0,
    };
  }
};

// Fetch all customers and join info from customer_courses for a given courseId
export const getCustomersWithCourseInfo = async (courseId: number) => {
  try {
    const { rows } = (await db.execute(sql`
      SELECT
        c.id AS "customerId",
        c.name,
        CASE WHEN cc.course_id IS NOT NULL THEN true ELSE false END AS "hasCourse",
        cc.shared_by_user_id AS "sharedByUserId",
        cc.created_at AS "sharedAt"
      FROM customers c
      LEFT JOIN customer_courses cc
        ON c.id = cc.customer_id AND cc.course_id = ${courseId}
      ORDER BY c.name ASC
    `)) as unknown as {
      rows: Array<{
        customerId: string;
        name: string;
        hasCourse: boolean;
        sharedByUserId?: string | null;
        sharedAt?: Date | null;
      }>;
    };

    return { success: true, data: rows };
  } catch (error) {
    console.error("Error at [getCustomersWithCourseInfo]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const updateCustomer = async (
  customerId: string,
  data: {
    name: string;
    contactInfo: string;
    invoiceInfo: string;
    licenses: number;
  },
) => {
  try {
    // First, let's get the number of active licenses
    const licensesCount = await db
      .select({ count: count() })
      .from(licensesTable)
      .where(eq(licensesTable.customerId, customerId));

    const activeUsedLicenses = Number(licensesCount[0]?.count || 0);

    // Validate that new license count isn't less than active licenses
    if (data.licenses < activeUsedLicenses) {
      throw new Error(
        `Cannot reduce licenses below ${activeUsedLicenses} (currently in use)`,
      );
    }

    const [updatedCustomer] = await db
      .update(customersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customersTable.id, customerId))
      .returning();

    return updatedCustomer;
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const deleteCustomer = async (customerId: string) => {
  try {
    // Delete the customer - the cascade will automatically delete all licenses
    const [deletedCustomer] = await db
      .delete(customersTable)
      .where(eq(customersTable.id, customerId))
      .returning();

    return deletedCustomer;
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

// export const getCustomersByLimitAndOffset = async (
// 	limit: number,
// 	offset: number,
// ) => {
// 	try {
// 		const customers = await db.query.customersTable.findMany({
// 			limit,
// 			offset,
// 			orderBy: [desc(customersTable.created_at)],
// 		});

// 		const total = await db
// 			.select({ count: sql<number>`count(*)` })
// 			.from(customersTable);

// 		return {
// 			customers,
// 			total: Number(total[0].count),
// 		};
// 	} catch (error) {
// 		console.error("Error fetching customers:", error);
// 		return {
// 			customers: [],
// 			total: 0,
// 		};
// 	}
// };

// export const getCustomersForNav = async () => {
// 	try {
// 		const customers = await db.query.customersTable.findMany({
// 			columns: {
// 				id: true,
// 				name: true,
// 			},
// 			orderBy: [desc(customersTable.created_at)],
// 		});

// 		return customers.map((customer) => ({
// 			name: customer.name,
// 			url: `/customers/${customer.id}`,
// 		}));
// 	} catch (error) {
// 		console.error("Error fetching customers for nav:", error);
// 		return [];
// 	}
// };
