import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { authClient } from "./auth-client";
import { cleanupPushTokenOnLogout } from "@/services/notifications/pushNotifications";

interface AuthContextProps {
  session: any;
  isPending: boolean;
  error: any;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    lastName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);

  const [value, setValue] = useState<
    Omit<
      AuthContextProps,
      | "signIn"
      | "signUp"
      | "signOut"
      | "deleteAccount"
      | "requestPasswordReset"
      | "resetPassword"
    >
  >({
    session: null,
    isPending: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    setValue({
      session,
      isPending,
      error,
      isAuthenticated: !!session,
    });
  }, [session, isPending, error]);

  // ===== Method: Sign In =====
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      if (!email || !password) {
        Alert.alert("Error", "Email and password are required");
        return;
      }

      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error || !data) {
        Alert.alert(
          "Authentication Error",
          error?.message || "Authentication failed"
        );
        return;
      }

      router.replace("/(app)");
    } catch (err) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to sign in. Please check your credentials.";

      Alert.alert("Sign In Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Method: Sign Up =====
  const signUp = async (
    email: string,
    password: string,
    name: string,
    lastName: string
  ): Promise<void> => {
    if (!email || !password) {
      throw new Error("Email and password are required."); 
    }

    try {
      const { data: signUpData, error: signUpError } =
        await authClient.signUp.email({
          email,
          password,
          name,
          lastName,
        });

      if (signUpError || !signUpData) {
        throw new Error(
          signUpError?.message || "Failed to create account. Please try again."
        );
      }

      const { data: signInData, error: signInError } =
        await authClient.signIn.email({
          email,
          password,
        });

      if (signInError || !signInData) {
        throw new Error(
          signInError?.message ||
            "Account created but couldn't sign in. Please login manually."
        );
      }

      // Wait for session to be updated in the provider
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Explicitly fetch session to ensure it's refreshed
      await authClient.$fetch("/api/auth/get-session");
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unexpected sign-up error.");
    }
  };
  // ===== Method: Sign Out =====
  const signOut = async () => {
    try {
      // Clean up push token before signing out
      await cleanupPushTokenOnLogout();

      await authClient.signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Sign Out Error", "Failed to log out.");
    }
  };

  // ===== Method: Delete Account =====
  const deleteAccount = async () => {
    try {
      setIsLoading(true);

      if (!session?.user?.id) {
        throw new Error("No active session found");
      }

      // Clean up push token before deleting account
      await cleanupPushTokenOnLogout();

      // Call the delete account endpoint using better-auth's $fetch
      await authClient.deleteUser();

      // Sign out and redirect to auth screen
      await authClient.signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.error("Error deleting account:", error);
      let errorMessage: string;
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = "Failed to delete account. Please try again.";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Method: Request Password Reset =====
  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);

      if (!email) {
        throw new Error("Email is required");
      }

      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: "https://kb.intressebevakaren.se/reset-password",
      });

      if (error) {
        throw new Error(
          error.message || "Failed to send reset email. Please try again."
        );
      }
    } catch (err) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to send reset email. Please try again.";

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Method: Reset Password =====
  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);

      if (!token || !password) {
        throw new Error("Token and password are required");
      }

      // Use the $fetch method to call the password reset endpoint
      const { error } = await authClient.$fetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      if (error) {
        throw new Error(
          error.message || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to reset password. Please try again.";

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...value,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
