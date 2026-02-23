import { authClient } from "./auth-client";
import type { UserRole } from "./permissions";

export async function CreateUser(
	name: string,
	email: string,
	password: string,
	role: UserRole,
) {
	try {
		const { data, error } = await authClient.admin.createUser({
			name: name,
			email: email,
			password: password,
			role: role as UserRole,
		});

		if (error) {
			throw new Error(error.message);
		}

		return data;
	} catch (error) {
		console.error(error);
	}
}
