import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/features/auth";

interface ChatTokenPurchase {
  id: number;
  amount: number;
  type: string;
  createdAt: string;
}

interface CoursePurchase {
  id: number;
  courseId: number;
  type: string;
  createdAt: string;
}

interface UserInfoResponse {
  chatTokenPurchases: ChatTokenPurchase[];
  coursePurchases: CoursePurchase[];
  totalPurchasedCourses: number;
  totalTokensUsed: number;
  totalTokensPurchased: number;
  totalDailyChatTokens: number;
  totalTokensAvailable: number;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const fetchUserInfo = useCallback(async () => {
    if (!userId) {
      setError("User ID not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config: { headers: Record<string, string> } = {
        headers: {
          "User-ID": userId || "",
        },
      };

      const response = await apiClient.get(
        `/api/expo/users?userId=${userId}`,
        config
      );

      if (response.status === 200) {
        console.log("Fetched User Info:", response.data);
        setUserInfo(response.data);
      } else {
        setError(`Failed to fetch user info: ${response.status}`);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      setError("Failed to fetch user information");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserInfo();
    }
  }, [userId, fetchUserInfo]);

  return {
    userInfo,
    isLoading,
    error,
    refetch: fetchUserInfo,
  };
};
