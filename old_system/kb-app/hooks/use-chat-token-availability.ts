import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/features/auth";

interface TokenAvailabilityResponse {
  tokensAvailable: boolean;
  totalTokensUsed: number;
  totalTokensPurchased: number;
  totalTokensAvailable: number;
  totalDailyChatTokens: number;
}

export const useChatTokenAvailability = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenAvailabilityResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const fetchTokenAvailability = useCallback(async () => {
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
        "/api/expo/chats/tokens-availability",
        config
      );

      if (response.status === 200) {
        setTokenInfo(response.data);
      } else {
        setError(`Failed to fetch token availability: ${response.status}`);
      }
    } catch (err) {
      console.error("Error fetching token availability:", err);
      setError("Failed to fetch token availability");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTokenAvailability();
    }
  }, [userId, fetchTokenAvailability]);

  return {
    tokenInfo,
    isLoading,
    error,
    refetch: fetchTokenAvailability,
  };
};
