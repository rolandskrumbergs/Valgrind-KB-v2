import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  customSessionClient,
  usernameClient,
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { ac, admin } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: ac,
      roles: {
        admin,
      },
      adminUserIds: ["WzlFNGGnu6IDBwl5Ur68UgQJSO1MPztz"],
    }),
    usernameClient(),
    customSessionClient<typeof auth>(),
  ],
});

export async function SignIn(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
      rememberMe,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function SignUp(email: string, password: string, name: string) {
  try {
    if (!email || !password || !name) {
      throw new Error("Email, password and name are required");
    }

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function SignOut() {
  try {
    const { error } = await authClient.signOut();

    if (error) {
      throw new Error(error.message);
    }

    window.location.href = "/";
  } catch (error) {
    console.error(error);
  }
}

export async function ForgotPassword(email: string) {
  try {
    if (!email) {
      throw new Error("Email is required");
    }

    const { data, error } = await authClient.forgetPassword({
      email,
      redirectTo:
        process.env.BETTER_AUTH_FORGET_PASSWORD_URL ||
        `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
