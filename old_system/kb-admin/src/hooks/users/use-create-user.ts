"use client";

import { useState } from "react";
import { CreateUserAction } from "@/actions/admin-actions";
import type { User } from "@/db/schema";

/**
 * Custom hook for creating a new user with better-auth and automatic SWR cache invalidation
 * @returns Functions for handling user creation
 */
export function useCreateUser() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  const createUser = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    securityNumber: string;
    customerId?: string;
    invited: boolean;
  }) => {
    setIsCreating(true);
    setError(null);
    try {
      const result = await CreateUserAction({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role as any,
        securityNumber: data.securityNumber,
        customerId: data.customerId,
        invited: data.invited,
      });

      if (!result.success) {
        setError(result.error || "Failed to create user");
        return null;
      }

      // Store the created user for reference
      if (result.data?.user) {
        setCreatedUser({
          ...result.data.user,
          lastName: data.lastName,
          securityNumber: data.securityNumber,
        } as User);
        return result.data.user as User;
      }

      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const resetState = () => {
    setCreatedUser(null);
    setError(null);
  };

  return {
    createUser,
    isCreating,
    error,
    createdUser,
    resetState,
  };
}
