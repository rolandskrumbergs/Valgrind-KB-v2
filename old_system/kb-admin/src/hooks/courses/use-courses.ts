"use client";

import useSWR from "swr";
import { getAdminCoursesAction } from "@/actions/courses-actions";
import type { Course } from "@/db/queries/course-queries";
import { COURSES_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching courses data with SWR
 * @returns Courses data, loading state, error state, and mutate function
 */
export function useCourses() {
  // Use SWR with our server action as the fetcher
  const { data, error, isLoading, mutate } = useSWR<Course[], Error>(
    COURSES_CACHE_KEY,
    async () => {
      const result = await getAdminCoursesAction();

      // Handle error from server action
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load courses");
      }

      return result.data;
    },
    {
      // Configure SWR options
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Deduplicate requests within this window (in milliseconds)
      dedupingInterval: 5000,
      // Keep showing previous data while revalidating
      keepPreviousData: true,
    },
  );

  return {
    courses: data || [],
    isLoading,
    error,
    mutate,
  };
}
