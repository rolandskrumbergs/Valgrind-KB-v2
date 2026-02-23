import { useQuery, useMutation, QueryKey } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import apiClient from "@/services/apiClient";
import { Course, UserCourseStatus } from "./types";

export type AnswerPayload = {
  questionId: number;
  option_id: number;
};

const coursesQueryKey = (status?: UserCourseStatus): QueryKey => [
  "courses",
  status,
];

const courseByIdQueryKey = (courseId: string): QueryKey => ["course", courseId];

const userCourseByIdQueryKey = (userId: string, courseId: string): QueryKey => [
  "userCourse",
  userId,
  courseId,
];

const courseCatalogQueryKey = (count?: number): QueryKey => [
  "courseCatalog",
  count,
];

const fetchCourses = async (
  userSessionId: string,
  status?: UserCourseStatus
): Promise<Course[]> => {
  const headers = { "User-ID": userSessionId };

  const params = new URLSearchParams();
  if (status) {
    params.append("status", status);
  }

  const queryString = params.toString();
  const url = "api/courses/" + (queryString ? "?" + queryString : "");

  const response = await apiClient(url, { headers });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch courses: ${response.status}`);
  }

  const data = response.data;

  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  throw new Error("Invalid response format from API");
};

const fetchCourseCatalog = async (userSessionId: string): Promise<Course[]> => {
  const headers = { "User-ID": userSessionId };

  const url = `api/course-catalog`;

  const response = await apiClient(url, { headers });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch courses: ${response.status}`);
  }

  const data = response.data;

  if (data && Array.isArray(data)) {
    return data;
  }
  throw new Error("Invalid response format from API");
};

export const useCoursesQuery = (status?: UserCourseStatus) => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Course[], Error>({
    queryKey: coursesQueryKey(status),
    queryFn: status
      ? () => fetchCourses(userSessionId, status)
      : () => fetchCourseCatalog(userSessionId),
    enabled: !!userSessionId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: [],
  });
};

export const useUserCoursesQuery = (status?: UserCourseStatus) => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Course[], Error>({
    queryKey: coursesQueryKey(status),
    queryFn: () => fetchCourses(userSessionId, status),
    enabled: !!userSessionId && !!status,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: [],
  });
};

export const useCourseCatalogQuery = () => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Course[], Error>({
    queryKey: courseCatalogQueryKey(),
    queryFn: () => fetchCourseCatalog(userSessionId),
    enabled: !!userSessionId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: [],
  });
};

const fetchCourseById = async (
  courseId: string,
  userSessionId: string
): Promise<Course> => {
  const headers = { "User-ID": userSessionId };
  const response = await apiClient(`/api/courses/${courseId}`, { headers });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch course: ${response.status}`);
  }

  const data = response.data;
  if (data.data) {
    return data.data;
  }

  throw new Error("Invalid response format from API");
};

const fetchUserCourseById = async (
  courseId: string,
  userSessionId: string
): Promise<Course | null> => {
  const headers = { "User-ID": userSessionId };
  const response = await apiClient(`/api/courses/user/${courseId}`, {
    headers,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch course: ${response.status}`);
  }

  const data = response.data;
  if (data.data) {
    return data.data;
  }

  return null;
};

export const useCourseByIdQuery = (courseId: string) => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Course, Error>({
    queryKey: courseByIdQueryKey(courseId),
    queryFn: () => fetchCourseById(courseId, userSessionId),
    enabled: !!userSessionId && !!courseId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useUserCourseByIdQuery = (courseId: string) => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useQuery<Course | null, Error>({
    queryKey: userCourseByIdQueryKey(userSessionId, courseId),
    queryFn: () => fetchUserCourseById(courseId, userSessionId),
    enabled: !!userSessionId && !!courseId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes to prevent flickering between navigations
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const purchaseCourse = async (courseId: number, accessType: "free") => {
  const response = await apiClient.post("/api/courses", {
    courseId,
    accessType,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to purchase course: ${response.status}`);
  }

  return response.data;
};

export const usePurchaseCourseMutation = () => {
  return useMutation({
    mutationFn: (payload: { courseId: number; accessType: "free" }) =>
      purchaseCourse(payload.courseId, payload.accessType),
  });
};

const updateCourseStatus = async (
  courseId: number,
  status: UserCourseStatus,
  userSessionId: string
) => {
  const headers = {
    "User-ID": userSessionId,
    "Content-Type": "application/json",
  };

  console.log("[Update Course Status] Request:", {
    url: `/api/courses/${courseId}/status`,
    headers,
    body: { status },
  });

  try {
    const response = await apiClient.patch(
      `/api/courses/${courseId}/status`,
      { status },
      { headers }
    );

    console.log("[Update Course Status] Response:", {
      status: response.status,
      data: response.data,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to update course status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("[Update Course Status] Error:", error);
    throw error;
  }
};

export const useUpdateCourseStatusMutation = () => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useMutation({
    mutationFn: (payload: { courseId: number; status: UserCourseStatus }) =>
      updateCourseStatus(payload.courseId, payload.status, userSessionId),
  });
};

const submitAnswers = async (
  courseId: string,
  answers: AnswerPayload[],
  userSessionId: string
) => {
  const headers = {
    "User-ID": userSessionId,
    "Content-Type": "application/json",
  };

  console.log("[Submit Answers] Request:", {
    url: `/api/courses/${courseId}/answers`,
    headers,
    body: answers,
  });

  try {
    const response = await apiClient.post(
      `/api/courses/${courseId}/answers`,
      answers,
      { headers }
    );

    console.log("[Submit Answers] Response:", {
      status: response.status,
      data: response.data,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to submit answers: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("[Submit Answers] Error:", error);
    throw error;
  }
};

export const useSubmitAnswersMutation = () => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  return useMutation({
    mutationFn: (payload: { courseId: string; answers: AnswerPayload[] }) =>
      submitAnswers(payload.courseId, payload.answers, userSessionId),
  });
};

const updateAnswers = async (courseId: number, answers: AnswerPayload[]) => {
  const response = await apiClient.patch(
    `/api/courses/${courseId}/answers`,
    answers
  );

  if (response.status !== 200) {
    throw new Error(`Failed to update answers: ${response.status}`);
  }

  return response.data;
};

export const useUpdateAnswersMutation = () => {
  return useMutation({
    mutationFn: (payload: { courseId: number; answers: AnswerPayload[] }) =>
      updateAnswers(payload.courseId, payload.answers),
  });
};
