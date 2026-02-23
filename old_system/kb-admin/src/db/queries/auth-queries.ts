import { eq } from "drizzle-orm";
import { db } from "..";
import { user } from "../schema";

export const findUserRole = async (userId: string) => {
	const userResult = await db.query.user.findFirst({
		where: eq(user.id, userId),
	});
	return userResult?.role;
};
