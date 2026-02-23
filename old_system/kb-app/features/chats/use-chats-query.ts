import { QueryKey, useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/features/auth";
import { Chat, ChatData } from "./types";

const chatIdQueryKey = (chatId: string): QueryKey => ["chat", chatId];

const fetchChats = async (
  userSessionId: string,
  count?: number
): Promise<Chat[]> => {
  const headers = {
    "User-ID": userSessionId,
    Count: count,
  };

  const response = await apiClient("/api/expo/chats", { headers });

  return response.data.chats;
};

export const useChatsQuery = (count?: number) => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Chat[], Error>({
    queryKey: ["chats", userSessionId, count],
    queryFn: () => fetchChats(userSessionId!, count),
    enabled: !!userSessionId,
    staleTime: 1000 * 60 * 5,
    placeholderData: [],
  });
};

const fetchChatById = async (
  userSessionId: string,
  chatId: string
): Promise<ChatData> => {
  const config: { headers: Record<string, string> } = {
    headers: {
      "User-ID": userSessionId,
    },
  };

  const response = await apiClient.get(`/api/expo/chats/${chatId}`, config);

  const data = response.data;

  if (response.status !== 200) {
    throw new Error(`Failed to fetch chat: ${response.status}`);
  }

  if (data) {
    return data;
  } else {
    throw new Error("Invalid response format from API");
  }
};

export const useChatByIdQuery = (
  chatId: string,
  shouldFetch: boolean = true
) => {
  const { session } = useAuth();

  const userSessionId = session?.user?.id;

  return useQuery<ChatData, Error>({
    queryKey: chatIdQueryKey(chatId),
    queryFn: () => fetchChatById(userSessionId!, chatId),
    enabled: !!userSessionId && !!chatId && shouldFetch,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Token availability response type
interface TokenAvailabilityResponse {
  tokensAvailable: boolean;
  totalTokensUsed: number;
  totalTokensPurchased: number;
  totalTokensAvailable: number;
  totalDailyChatTokens: number;
}

// New function to check token availability
const checkTokenAvailability = async (
  userSessionId: string
): Promise<TokenAvailabilityResponse> => {
  const config: { headers: Record<string, string> } = {
    headers: {
      "User-ID": userSessionId,
    },
  };

  const response = await apiClient.get(
    "/api/expo/chats/tokens-availability",
    config
  );

  if (response.status !== 200) {
    throw new Error(`Failed to check token availability: ${response.status}`);
  }

  return response.data;
};

export const useTokenAvailabilityQuery = () => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<TokenAvailabilityResponse, Error>({
    queryKey: ["token-availability", userSessionId],
    queryFn: () => checkTokenAvailability(userSessionId!),
    enabled: !!userSessionId,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Export the function for direct use
export { checkTokenAvailability };
