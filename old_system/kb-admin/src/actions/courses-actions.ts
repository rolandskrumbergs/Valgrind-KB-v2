"use server";

import {
  Chapter,
  Course,
  createChapters,
  createCourse,
  CustomerCourse,
  deleteCourseById,
  getCourseById,
  getAllCourses,
  updateCourseById,
  updateChapterById,
  updateQuestions,
  createQuestionsForChapter,
  type UpdateCoursePayload,
  type UpdateChapterPayload,
  type UpdateQuestionPayload,
  type CreateQuestionPayload,
  shareCourseWithCustomer,
  deleteCourseChaptersByIds,
  Response,
  deleteChapterQuestionsByIds,
  getCustomerCoursesByCustomerId,
  shareAllCustomerCoursesWithNewUsers,
} from "@/db/queries/course-queries";
import { GetSessionInServer, CheckPermissionOfUser } from "./auth-action";
import { uploadImageToS3Action } from "./common-actions";

// --- GET ---

export async function getAdminCoursesAction(): Promise<{
  success: boolean;
  data?: Course[];
  error?: string;
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canReadEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "read",
  );

  if (!canReadEducations.success) {
    return {
      success: false,
      error: "You do not have permission to view educations",
    };
  }

  // Admin users should see all courses, not just their own
  return getAllCourses();
}

export async function getCourseByIdAction(id: string): Promise<{
  success: boolean;
  data?: Course;
  error?: string;
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canReadEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "read",
  );

  if (!canReadEducations.success) {
    return {
      success: false,
      error: "You do not have permission to view educations",
    };
  }

  return getCourseById({ id });
}

export async function getCustomerCoursesByCustomerIdAction(
  customerId: string,
): Promise<{
  success: boolean;
  data?: Array<{
    customerId: string;
    sharedByUserName: string | null;
    createdAt: Date;
    title: string;
  }>;
  error?: string;
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canReadEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "read",
  );

  if (!canReadEducations.success) {
    return {
      success: false,
      error: "You do not have permission to view educations",
    };
  }

  return getCustomerCoursesByCustomerId(customerId);
}

// --- UPDATE ---

export async function updateCourseAction(
  data: UpdateCoursePayload,
): Promise<{ success: boolean; data?: Course; error?: string }> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canUpdateEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canUpdateEducations.success) {
    return {
      success: false,
      error: "You do not have permission to update educations",
    };
  }

  return updateCourseById(data);
}

export async function updateChapterAction(
  data: UpdateChapterPayload,
): Promise<{ success: boolean; data?: Chapter; error?: string }> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canUpdateEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canUpdateEducations.success) {
    return {
      success: false,
      error: "You do not have permission to update educations",
    };
  }

  return updateChapterById(data);
}

export async function updateQuestionsAction(
  data: UpdateQuestionPayload[],
): Promise<{ success: boolean; error?: string }> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canUpdateEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canUpdateEducations.success) {
    return {
      success: false,
      error: "You do not have permission to update educations",
    };
  }

  return updateQuestions(data);
}

export async function createChapterQuestionsAction(
  data: CreateQuestionPayload[],
): Promise<{ success: boolean; error?: string; data?: any }> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canUpdateEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canUpdateEducations.success) {
    return {
      success: false,
      error: "You do not have permission to update educations",
    };
  }

  return createQuestionsForChapter(data);
}

// --- POST ---

export async function createCourseAction(
  data: Omit<Course, "courseId" | "creatorId" | "uuid" | "currency">,
): Promise<{
  success: boolean;
  data?: { courseId: number };
  error?: string;
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canWriteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canWriteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to update educations",
    };
  }

  return createCourse({
    ...data,
    currency: "SEK",
    creatorId: sessionData.user.id,
  });
}

export async function createChaptersAction(data: Chapter[]): Promise<{
  success: boolean;
  error?: string;
  data?: Chapter[];
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canWriteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canWriteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to write educations",
    };
  }

  return createChapters(data);
}

export async function uploadCourseImageAction(
  file: File,
): Promise<Response<{ s3ImageUrl: string }>> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canWriteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canWriteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to write educations",
    };
  }

  const s3ImageUrl = await uploadImageToS3Action(
    file,
    process.env.AWS_COURSES_IMAGES_BUCKET,
    process.env.AWS_REGION,
  );

  return { success: true, data: { s3ImageUrl } };
}

export async function shareCourseWithCustomerAction(
  data: Omit<CustomerCourse, "sharedByUserId">,
) {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canWriteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canWriteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to write educations",
    };
  }

  return shareCourseWithCustomer({
    ...data,
    sharedByUserId: sessionData.user.id,
  });
}

export async function shareAllCustomerCoursesWithNewUsersAction(
  customerId: string,
  userIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canWriteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "update",
  );

  if (!canWriteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to write educations",
    };
  }

  return shareAllCustomerCoursesWithNewUsers(customerId, userIds);
}

// --- DELETE ---

export async function deleteAdminCourseAction(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canDeleteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "delete",
  );

  if (!canDeleteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to delete educations",
    };
  }

  return deleteCourseById(id);
}

export async function deleteCourseChapters(
  chapterIds: number[],
): Promise<Response> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canDeleteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "delete",
  );

  if (!canDeleteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to delete educations",
    };
  }

  return deleteCourseChaptersByIds(chapterIds);
}

export async function deleteChapterQuestions(
  questionIds: number[],
): Promise<Response> {
  const sessionData = await GetSessionInServer();

  if (!sessionData) {
    return { success: false, error: "You are not logged in" };
  }

  const canDeleteEducations = await CheckPermissionOfUser(
    sessionData.user.id,
    "educations",
    "delete",
  );

  if (!canDeleteEducations.success) {
    return {
      success: false,
      error: "You do not have permission to delete educations",
    };
  }

  return deleteChapterQuestionsByIds(questionIds);
}
