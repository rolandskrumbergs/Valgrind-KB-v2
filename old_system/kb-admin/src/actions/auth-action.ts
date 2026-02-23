"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function SignIn(email: string, password: string) {
  const response = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
    asResponse: true,
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.message || "Authentication failed" };
  }

  return { success: true };
}

export async function GetSessionInServer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = session.user;
  const role = session.user?.role;

  return { session, user, role };
}

export async function CheckPermissionOfUser(
  userId: string,
  area: string,
  permission: string,
) {
  const hasPermission = await auth.api.userHasPermission({
    body: {
      userId,
      permission: {
        [area]: [permission],
      },
    },
    headers: await headers(),
  });

  // Debug logging to help troubleshoot permission issues
  if (!hasPermission.success) {
    console.log(`Permission denied for user ${userId}: ${area}.${permission}`);
    console.log("Permission check result:", hasPermission);
  }

  return hasPermission;
}
