import { QueryKey, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import apiClient from "@/services/apiClient";
import { NewsItemInList, NewsItem } from "./types";

const newsQueryKey = () => ["news"];

const newsIdQueryKey = (newsId: string): QueryKey => ["news", newsId];

const fetchNews = async (
  userSessionId: string,
  count?: number
): Promise<NewsItemInList[]> => {
  const config: { headers: Record<string, string> } = {
    headers: {
      "User-ID": userSessionId,
    },
  };

  if (count) {
    config.headers["Count"] = count.toString();
  }

  const response = await apiClient.get("/api/expo/news", config);

  const data = response.data;

  if (response.status !== 200) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }

  if (data.news && Array.isArray(data.news)) {
    return data.news;
  } else {
    throw new Error("Invalid response format from API");
  }
};

export const useNewsQuery = (count?: number) => {
  const { session } = useAuth();

  const userSessionId = session?.user?.id;

  return useQuery<NewsItemInList[], Error>({
    queryKey: newsQueryKey(),
    queryFn: () => fetchNews(userSessionId, count),
    enabled: !!userSessionId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: [],
  });
};

const fetchNewsById = async (
  userSessionId: string,
  newsId: string
): Promise<NewsItem> => {
  const config: { headers: Record<string, string> } = {
    headers: {
      "User-ID": userSessionId,
    },
  };

  const response = await apiClient.get(`/api/expo/news/${newsId}`, config);

  const data = response.data;

  if (response.status !== 200) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }

  if (data.news) {
    return data.news;
  } else {
    throw new Error("Invalid response format from API");
  }
};

export const useNewsByIdQuery = (newsId: string) => {
  const { session } = useAuth();

  const userSessionId = session?.user?.id;

  return useQuery<NewsItem, Error>({
    queryKey: newsIdQueryKey(newsId),
    queryFn: () => fetchNewsById(userSessionId, newsId),
    enabled: !!userSessionId && !!newsId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};
