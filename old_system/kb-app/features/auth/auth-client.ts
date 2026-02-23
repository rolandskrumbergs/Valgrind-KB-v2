import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import {
  usernameClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ?? "https://kb.intressebevakaren.se/";

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    expoClient({
      scheme: "kb-app",
      storagePrefix: "kb-app",
      storage: SecureStore,
    }),
    usernameClient(),

    inferAdditionalFields({
      user: {
        lastName: {
          type: "string",
          input: true,
        },
      },
    }),
  ],
});
