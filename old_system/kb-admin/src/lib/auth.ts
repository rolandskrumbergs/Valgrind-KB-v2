import { db } from "@/db";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import {
  admin as adminPlugin,
  customSession,
  username,
} from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getLicenseByUserId } from "@/db/queries/license-queries";
import { ac, admin } from "@/lib/permissions";
import { sendPasswordResetEmail } from "./email";

const options = {
  baseURL: process.env.BETTER_AUTH_URL,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 48 * 60 * 60, // 48 hours
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ email: user.email, resetUrl: url });
    },
  },
  plugins: [
    adminPlugin({
      ac: ac,
      roles: {
        admin,
      },
      adminUserIds: ["Zsy4cfZ6egI0Pu7WyRvCVJs6VlyHl1yU"],
    }),
    expo(),
    username(),
    nextCookies(),
  ],
  trustedOrigins: [
    "ibben-app://",
    "https://kb.intressebevakaren.se",
    "http://localhost:3000",
  ],
  user: {
    additionalFields: {
      lastName: {
        type: "string",
        input: true,
      },
      securityNumber: {
        type: "string",
        input: true,
      },
      purchasedChatTokens: {
        type: "number",
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      let license = null;

      if (user.role === "user") {
        license = await getLicenseByUserId(user.id);
      }

      return {
        user: {
          ...user,
          hasLicense: Boolean(license),
          organization: license?.customer?.name ?? null,
        },
        session,
      };
    }, options),
  ],
});
