"use client";

import { useState } from "react";
import { CreateUserAction } from "@/actions/admin-actions";
import { createLicenseAction } from "@/actions/license-actions";
import { shareAllCustomerCoursesWithNewUsersAction } from "@/actions/courses-actions";
import { mutate } from "swr";
import {
  LICENSES_CACHE_KEY,
  CUSTOMERS_CACHE_KEY,
  DEFAULT_USER_PASSWORD,
} from "@/constants/cache-keys";
import { authClient } from "@/lib/auth-client";

interface BulkCreateResult {
  created: number;
  linked: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

interface CsvUserData {
  firstName: string;
  lastName: string;
  email: string;
  personalNumber: string;
  role: string;
}

/**
 * Custom hook for bulk creating users from CSV file and linking them to a customer
 * @returns Functions for handling bulk user creation
 */
export function useBulkCreateUsers() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  const parseCsvFile = (file: File): Promise<CsvUserData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            reject(
              new Error(
                "CSV file must contain at least a header and one data row",
              ),
            );
            return;
          }

          // Parse header
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());
          const expectedHeaders = [
            "firstname",
            "lastname",
            "email",
            "personal_number",
            "role",
          ];

          // Check if all required headers are present
          const missingHeaders = expectedHeaders.filter(
            (h) => !headers.includes(h),
          );
          if (missingHeaders.length > 0) {
            reject(
              new Error(
                `Missing required headers: ${missingHeaders.join(", ")}`,
              ),
            );
            return;
          }

          // Parse data rows
          const users: CsvUserData[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim());

            if (values.length !== headers.length) {
              reject(new Error(`Row ${i + 1} has incorrect number of columns`));
              return;
            }

            const userData: any = {};
            headers.forEach((header, index) => {
              userData[header] = values[index];
            });

            // Map personal_number to personalNumber
            if (userData.personal_number) {
              userData.personalNumber = userData.personal_number;
              delete userData.personal_number;
            }

            // Basic validation
            if (
              !userData.firstname ||
              !userData.lastname ||
              !userData.email ||
              !userData.personalNumber ||
              !userData.role
            ) {
              reject(new Error(`Row ${i + 1} is missing required fields`));
              return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
              reject(new Error(`Row ${i + 1} has invalid email format`));
              return;
            }

            users.push({
              firstName: userData.firstname.trim(),
              lastName: userData.lastname.trim(),
              email: userData.email,
              personalNumber: userData.personalNumber,
              role: userData.role,
            });
          }

          resolve(users);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  };

  const bulkCreateUsers = async (file: File, customerId: string) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Parse CSV file
      const usersData = await parseCsvFile(file);

      if (usersData.length === 0) {
        setError("No valid users found in CSV file");
        return null;
      }

      const result: BulkCreateResult = {
        created: 0,
        linked: 0,
        skipped: 0,
        errors: [],
      };

      const createdUserIds: string[] = [];

      // Import getUserByEmail for checking existing users
      const { getUserByEmail } = await import("@/db/queries/user-queries");

      // Process each user
      for (const userData of usersData) {
        try {
          let userId: string;
          let userWasCreated = false;

          // Check if user already exists by email
          const existingUserResult = await getUserByEmail(userData.email);

          if (existingUserResult.success && existingUserResult.data) {
            // User already exists, use existing user ID
            userId = existingUserResult.data.id;
          } else {
            // User doesn't exist, try to create user
            const createUserResult = await CreateUserAction({
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              password: DEFAULT_USER_PASSWORD,
              role: userData.role as any,
              securityNumber: userData.personalNumber,
              customerId: customerId,
              invited: true,
            });

            if (createUserResult.success && createUserResult.data?.user) {
              userId = createUserResult.data.user.id;
              createdUserIds.push(userId);
              result.created++;
              userWasCreated = true;
            } else {
              // Failed to create user
              result.errors.push({
                email: userData.email,
                error: createUserResult.error || "Failed to create user",
              });
              continue; // Skip to next user
            }
          }

          // Try to create license for the user (idempotent - returns existing if present)
          const licenseResult = await createLicenseAction(userId, customerId);

          if (licenseResult && !("error" in licenseResult)) {
            // License was created or already exists
            if (userWasCreated) {
              result.linked++;

              const { error } = await authClient.forgetPassword({
                email: userData.email,
                redirectTo: `${process.env.BETTER_AUTH_FORGET_PASSWORD_URL}?id=${userId}`,
              });

              if (error) {
                result.errors.push({
                  email: userData.email,
                  error:
                    "User and license created but failed to send reset password email",
                });
              }
            } else {
              // User already existed, license either existed or was just created
              result.skipped++;
            }
          } else {
            // Failed to create license
            if (userWasCreated) {
              result.errors.push({
                email: userData.email,
                error: "User created but failed to create license",
              });
            } else {
              result.errors.push({
                email: userData.email,
                error: licenseResult?.error || "Failed to create license",
              });
            }
          }
        } catch (err) {
          result.errors.push({
            email: userData.email,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      // Share courses with newly created users if any were created
      if (createdUserIds.length > 0) {
        try {
          await shareAllCustomerCoursesWithNewUsersAction(
            customerId,
            createdUserIds,
          );
        } catch (err) {
          console.error("Failed to share courses with new users:", err);
          // Don't fail the entire operation for this
        }
      }

      setResult(result);

      // Update caches
      mutate(`${LICENSES_CACHE_KEY}-${customerId}`);
      mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setError(null);
  };

  return {
    bulkCreateUsers,
    isProcessing,
    error,
    result,
    resetState,
  };
}
