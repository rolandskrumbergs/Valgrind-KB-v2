import { eq, sql, and, inArray } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { logger } from "better-auth";

import { db } from "..";
import {
  chapters,
  courses,
  type coursesStatusEnum,
  questions,
  questionOptions,
  type questionsTypeEnum,
  userCoursesAccessType,
  userCourses,
  customerCourses,
  userQuestionAnswers,
  coursePurchases,
  chatTokensPurchases,
  user,
} from "../schema";

import { getAssignableUsersForCourse } from "./user-queries";

interface ChatTokensPurchase {
  id: number;
  userId: string;
  amount: number;
  price: string | null;
  priceInPurchasedCurrency: string | null;
  purchasedInCurrency: string;
  transactionId: string;
  type: string;
  createdAt: Date;
}

interface CoursePurchase {
  id: number;
  userId: string;
  courseId: number;
  price: string | null;
  priceInPurchasedCurrency: string | null;
  purchasedInCurrency: string;
  transactionId: string;
  type: string;
  createdAt: Date;
}

/** Minimum score percentage required to pass a course and receive a certificate */
export const COURSE_PASSING_THRESHOLD = 80;

interface UserCompletedCourseDetails {
  courseId: number;
  uuid: string;
  title: string;
  completedOn: Date;
  score: number;
  passed: boolean;
  certificateId?: string | null;
  certificateEnabled: boolean;
}

export interface UserQuestionAnswer {
  userId: string | null;
  questionId: number | null;
  option_id: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCourseStatus = "completed" | "not_started" | "in_progress";

export interface UserCourse {
  customerId?: string | null;
  userId?: string | null;
  courseId: number | null;
  lastChapterId: number | null;
  status: UserCourseStatus;
  accessType: "free" | "purchase" | "organization";
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date | null;
}

export interface CustomerCourse {
  customerId: string;
  courseId: number | null;
  sharedByUserId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionOption {
  optionId?: number;
  questionId?: number | null;
  text: string;
  isCorrect: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum QuestionType {
  multiple_choice = "multiple_choice",
}

interface Question {
  questionId?: number;
  chapterId?: number | null;
  text: string;
  description: string | null;
  feedback: string | null;
  type: QuestionType;
  createdAt?: Date;
  updatedAt?: Date;
  userAnswerOptionId?: number;
  options?: QuestionOption[];
}

export interface Chapter {
  chapterId?: number;
  courseId: number | null;
  title: string;
  description: string | null;
  videoUrl: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  questions?: Question[];
}

export const CourseStatus = {
  draft: "draft",
  published: "published",
} as const;

export interface Course {
  courseId?: number;
  uuid: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  status: (typeof CourseStatus)[keyof typeof CourseStatus];
  certificateEnabled: boolean;
  creatorId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  chapters?: Chapter[];
}

export interface UserCourseWithScore extends Course {
  score: number | null;
  passed: boolean | null;
  requiredScore: number;
  amountOfQuestions: number;
  completedAt: Date | null;
}

export interface Response<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- GET ---

export const getCourseById = async ({
  id,
}: {
  id: string;
}): Promise<Response<Course>> => {
  try {
    const {
      rows: [course],
    } = (await db.execute(sql`
      SELECT
        c.course_id AS "courseId",
        c.uuid,
        c.title,
        c.description,
        c.image_url AS "imageUrl",
        c.price,
        c.currency,
        c.status,
        c.certificate_enabled AS "certificateEnabled",
        c.created_at AS "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'chapterId', ch.chapter_id,
              'courseId', ch.course_id,
              'title', ch.title,
              'description', ch.description,
              'videoUrl', ch.video_url,
              'createdAt', ch.created_at,
              'questions', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'questionId', q.question_id,
                    'chapterId', q.chapter_id,
                    'text', q.text,
                    'description', q.description,
                    'feedback', q.feedback,
                    'type', q.type,
                    'createdAt', q.created_at,
                    'options', (
                      SELECT COALESCE(json_agg(
                        json_build_object(
                          'optionId', qo.option_id,
                          'questionId', qo.question_id,
                          'text', qo.text,
                          'isCorrect', qo.is_correct
                        ) ORDER BY qo.option_id ASC
                      ), '[]'::json)
                      FROM question_options qo
                      WHERE qo.question_id = q.question_id
                    )
                  ) ORDER BY q.question_id ASC
                ), '[]'::json)
                FROM questions q
                WHERE q.chapter_id = ch.chapter_id
              )
            ) ORDER BY ch.order ASC, ch.chapter_id ASC
          ) FILTER (WHERE ch.chapter_id IS NOT NULL),
          '[]'::json
        ) AS chapters
      FROM courses c
      LEFT JOIN chapters ch ON ch.course_id = c.course_id
      WHERE c.course_id = ${id}
      GROUP BY c.course_id, c.uuid, c.title, c.description, c.image_url, c.price, c.currency, c.status, c.certificate_enabled, c.created_at
    `)) as unknown as { rows: Course[] };

    if (!course) {
      return { success: false, error: "Not Found" };
    }

    return { success: true, data: course };
  } catch (error) {
    console.error("Error at [getCourseById]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getUserCourseById = async ({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}): Promise<Response<UserCourseWithScore>> => {
  try {
    const {
      rows: [course],
    } = (await db.execute(sql`
      SELECT
        c.course_id AS "courseId",
        c.uuid,
        c.title,
        c.description,
        c.image_url AS "imageUrl",
        c.price,
        c.currency,
        uc.status,
        c.certificate_enabled AS "certificateEnabled",
        c.created_at AS "createdAt",
        uc.completed_at AS "completedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'chapterId', ch.chapter_id,
              'courseId', ch.course_id,
              'title', ch.title,
              'description', ch.description,
              'videoUrl', ch.video_url,
              'order', ch.order,
              'createdAt', ch.created_at,
              'questions', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'questionId', q.question_id,
                    'chapterId', q.chapter_id,
                    'text', q.text,
                    'description', q.description,
                    'feedback', q.feedback,
                    'type', q.type,
                    'createdAt', q.created_at,
                    'userAnswerOptionIds', (
                      SELECT COALESCE(array_agg(uqa.option_id), '{}') AS "optionId"
                      FROM user_question_answers uqa
                      WHERE uqa.question_id = q.question_id AND uqa.user_id = ${userId}
                    ),
                    'options', (
                      SELECT COALESCE(json_agg(
                        json_build_object(
                          'optionId', qo.option_id,
                          'questionId', qo.question_id,
                          'text', qo.text,
                          'isCorrect', qo.is_correct
                          ) ORDER BY qo.option_id ASC
                        ), '[]'::json)
                      FROM question_options qo
                      WHERE qo.question_id = q.question_id
                    )
                  ) ORDER BY q.question_id ASC
                ), '[]'::json)
                FROM questions q
                WHERE q.chapter_id = ch.chapter_id
              )
            ) ORDER BY ch.order ASC, ch.chapter_id ASC
          ) FILTER (WHERE ch.chapter_id IS NOT NULL),
          '[]'::json
        ) AS chapters
      FROM courses c
      LEFT JOIN chapters ch ON ch.course_id = c.course_id
      LEFT JOIN user_courses uc ON uc.course_id = c.course_id
      WHERE c.course_id = ${courseId} AND uc.user_id = ${userId}
      GROUP BY c.course_id, c.uuid, c.title, c.description, c.image_url, c.price, c.currency, uc.status, c.certificate_enabled, c.created_at, uc.completed_at
    `)) as unknown as { rows: (Course & { completedAt: Date | null })[] };

    if (!course) {
      return { success: false, error: "Not Found" };
    }

    // Calculate score from chapters/questions data
    let totalQuestions = 0;
    let correctAnswers = 0;

    if (course.chapters) {
      for (const chapter of course.chapters) {
        if (chapter.questions) {
          for (const question of chapter.questions) {
            // Only count questions that have options with correct answers defined
            const hasCorrectOption = question.options?.some(
              (opt) => opt.isCorrect === true,
            );
            if (hasCorrectOption) {
              totalQuestions++;
              // Check if user answered correctly
              const userAnswerIds = (
                question as unknown as { userAnswerOptionIds?: number[] }
              ).userAnswerOptionIds;
              if (userAnswerIds && userAnswerIds.length > 0) {
                const correctOption = question.options?.find(
                  (opt) => opt.isCorrect === true,
                );
                if (
                  correctOption &&
                  userAnswerIds.includes(correctOption.optionId!)
                ) {
                  correctAnswers++;
                }
              }
            }
          }
        }
      }
    }

    // If there are no questions, consider the course 100% complete
    const score =
      totalQuestions > 0
        ? Number(((correctAnswers / totalQuestions) * 100).toFixed(1))
        : 100;
    const passed = score >= COURSE_PASSING_THRESHOLD;

    const courseWithScore: UserCourseWithScore = {
      ...course,
      score,
      passed,
      requiredScore: COURSE_PASSING_THRESHOLD,
      amountOfQuestions: totalQuestions,
      completedAt: course.completedAt,
    };

    return { success: true, data: courseWithScore };
  } catch (error) {
    console.error("Error at [getUserCourseById]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getCoursesByAdminId = async (
  id: string,
): Promise<Response<Course[]>> => {
  try {
    const result = await db.query.courses.findMany({
      where: eq(courses.creatorId, id),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error at [getCoursesByAdminId]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getCustomerCoursesByCustomerId = async (
  customerId: string,
): Promise<
  Response<
    Array<{
      customerId: string;
      sharedByUserName: string | null;
      createdAt: Date;
      title: string;
    }>
  >
> => {
  try {
    const { rows } = (await db.execute(sql`
      SELECT
        cc.customer_id AS "customerId",
        CONCAT(u.name, ' ', u.last_name) AS "sharedByUserName",
        cc.created_at AS "createdAt",
        c.title
      FROM customer_courses cc
      JOIN courses c ON cc.course_id = c.course_id
      LEFT JOIN "user" u ON cc.shared_by_user_id = u.id
      WHERE cc.customer_id = ${customerId}
      ORDER BY cc.created_at DESC
    `)) as unknown as {
      rows: Array<{
        customerId: string;
        sharedByUserName: string | null;
        createdAt: Date;
        title: string;
      }>;
    };

    return { success: true, data: rows };
  } catch (error) {
    console.error("Error at [getCustomerCoursesByCustomerId]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getCoursesByUserId = async (
  id: string,
  status?: UserCourseStatus,
): Promise<Response<UserCourse[] | any[]>> => {
  try {
    if (status) {
      const andStatusClause = status ? sql`AND uc.status = ${status}` : sql``;

      const { rows } = (await db.execute(sql`
          SELECT
            uc.user_id AS "userId",
            uc.course_id AS "courseId",
            uc.status,
            uc.access_type AS "accessType",
            uc.completed_at AS "completedAt",
            c.title,
            c.uuid,
            c.description,
            c.price,
            c.currency,
            c.image_url AS "imageUrl",
            c.status AS "courseStatus",
            c.certificate_enabled AS "certificateEnabled",
            c.created_at AS "createdAt"
          FROM user_courses uc
          JOIN courses c ON uc.course_id = c.course_id
          WHERE uc.user_id = ${id}
          ${andStatusClause}
        `)) as unknown as { rows: UserCourse[] };

      return {
        success: true,
        data: rows.map((course) => ({ ...course, isPurchased: true })),
      };
    }

    const userCoursesData = await db.query.userCourses.findMany({
      where: eq(userCourses.userId, id),
    });
    const userCoursesIds = new Set(
      userCoursesData.map((course) => course.courseId),
    );
    const { data: allCourses } = await getAllCourses();
    const mappedCourses = allCourses?.map((course) => {
      const { status, ...rest } = course;
      const isPurchased = userCoursesIds.has(Number(course.courseId));
      const userCourseStatus = userCoursesData.find(
        (userCourse) => userCourse.courseId === course.courseId,
      )?.status;
      const result = {
        ...rest,
        courseStatus: status,
        isPurchased,
        userCourseStatus,
      };
      return result;
    });

    return { success: true, data: mappedCourses };
  } catch (error) {
    console.error("Error at [getCoursesByUserId]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getUserCompletedCoursesDetails = async (
  userId: string,
): Promise<Response<UserCompletedCourseDetails[]>> => {
  try {
    // because we support 2 types of questions:
    // 1. questions with right/wrong answer
    // 2. questions with no right/wrong answer
    // we take into consideration only first type of questions and answers to them
    // to calculate user score

    console.log("userId", userId);

    const { rows } = (await db.execute(sql`
      SELECT
        c.course_id AS "courseId",
        c.title,
        c.certificate_enabled AS "certificateEnabled",
        COALESCE(uc.completed_at, uc.updated_at) AS "completedOn",
        uc.certificate_id AS "certificateId",
        CAST(COUNT(q.question_id) AS INTEGER) AS "questionsCount",
        json_agg(
          json_build_object(
            'optionId', qo.option_id,
            'userAnswerOptionId', (
              SELECT uqa.option_id
              FROM user_question_answers uqa
                WHERE uqa.question_id = qo.question_id
                AND uqa.user_id = ${userId}
            )
          )
        ) AS "questionOptions"
      FROM user_courses uc
      LEFT JOIN courses c ON uc.course_id = c.course_id
      LEFT JOIN chapters ch ON ch.course_id = uc.course_id
      LEFT JOIN questions q ON q.chapter_id = ch.chapter_id
      LEFT JOIN question_options qo ON qo.question_id = q.question_id
        WHERE uc.user_id = ${userId}
        AND uc.status = 'completed'
      GROUP BY c.course_id, c.title, c.certificate_enabled, uc.completed_at, uc.updated_at, uc.certificate_id
      ORDER BY c.course_id
    `)) as unknown as {
      rows: {
        courseId: number;
        uuid: string;
        title: string;
        certificateEnabled: boolean;
        completedOn: Date;
        certificateId?: string | null;
        questionsCount: number;
        questionOptions: { optionId: number; userAnswerOptionId: number }[];
      }[];
    };

    console.log("rows", rows);

    const completedCoursesDetails: UserCompletedCourseDetails[] = rows.map(
      (course) => {
        const correctAnswersCount = course.questionOptions.reduce(
          (acc, curr) => {
            if (curr.optionId === curr.userAnswerOptionId) {
              acc++;
            }
            return acc;
          },
          0,
        );
        const score = Number(
          ((correctAnswersCount / course.questionsCount) * 100).toFixed(1),
        );
        const passed = score >= COURSE_PASSING_THRESHOLD;

        return {
          courseId: course.courseId,
          uuid: course.uuid,
          title: course.title,
          completedOn: course.completedOn,
          score,
          passed,
          certificateId: course.certificateId,
          certificateEnabled: course.certificateEnabled,
        };
      },
    );

    return { success: true, data: completedCoursesDetails };
  } catch (error) {
    console.error("Error at [getUserCompletedCoursesDetails]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const getAllCourses = async (): Promise<Response<Course[]>> => {
  try {
    const result = await db.query.courses.findMany();

    return { success: true, data: result };
  } catch (error) {
    console.error("Error at [getAllCourses]:", error);
    return { success: false, error: (error as Error).message };
  }
};

// --- CERTIFICATE MANAGEMENT ---

export const updateUserCourseCertificateId = async (
  userId: string,
  courseId: number,
  certificateId: string,
): Promise<Response> => {
  try {
    await db
      .update(userCourses)
      .set({ certificateId })
      .where(
        and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)),
      );

    return { success: true };
  } catch (error) {
    console.error("Error at [updateUserCourseCertificateId]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const verifyCertificateById = async (certificateId: string) => {
  try {
    const result = await db.query.userCourses.findFirst({
      where: eq(userCourses.certificateId, certificateId),
      with: {
        user: {
          columns: {
            name: true,
            lastName: true,
          },
        },
        course: {
          columns: {
            title: true,
          },
        },
      },
    });

    return result;
  } catch (error) {
    console.error("Error at [verifyCertificateById]:", error);
    return null;
  }
};

// --- POST ---

export const createCourse = async (
  data: Omit<Course, "uuid" | "courseId">,
): Promise<Response<{ courseId: number }>> => {
  try {
    const [{ courseId }] = await db.insert(courses).values(data).returning();

    return { success: true, data: { courseId } };
  } catch (error) {
    console.error("Error at [createCourse]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const createChapters = async (
  data: Chapter[],
): Promise<Response<Chapter[]>> => {
  try {
    const createdChaptersData: Chapter[] = [];

    for (const chapter of data) {
      // Exclude auto-generated fields (serial primary key and timestamps)
      const {
        chapterId,
        createdAt,
        updatedAt,
        questions: chapterQuestions,
        ...chapterData
      } = chapter;

      // Prepare insert data with only the fields that should be inserted
      const chapterInsertData: InferInsertModel<typeof chapters> = {
        courseId: chapterData.courseId,
        title: chapterData.title,
        description: chapterData.description,
        videoUrl: chapterData.videoUrl,
        order: chapterData.order,
      };

      const [newChapter] = await db
        .insert(chapters)
        .values(chapterInsertData)
        .returning();

      const createdQuestions: Question[] = [];
      if (chapterQuestions?.length) {
        for (const question of chapterQuestions) {
          // Exclude auto-generated fields (serial primary key and timestamps)
          const { questionId, createdAt, updatedAt, options, ...questionData } =
            question;

          // Prepare insert data with only the fields that should be inserted
          const questionInsertData: InferInsertModel<typeof questions> = {
            chapterId: newChapter.chapterId,
            text: questionData.text,
            description: questionData.description,
            feedback: questionData.feedback,
            type: questionData.type,
          };

          const [newQuestion] = await db
            .insert(questions)
            .values(questionInsertData)
            .returning();

          let createdOptions: QuestionOption[] = [];
          if (options?.length) {
            // Prepare insert data for options
            const newOptionsToInsert: InferInsertModel<
              typeof questionOptions
            >[] = options.map(
              ({ optionId, createdAt, updatedAt, ...option }) => ({
                questionId: newQuestion.questionId,
                text: option.text,
                isCorrect: option.isCorrect,
              }),
            );
            createdOptions = await db
              .insert(questionOptions)
              .values(newOptionsToInsert)
              .returning();
          }

          createdQuestions.push({
            ...newQuestion,
            type: newQuestion.type as QuestionType,
            options: createdOptions,
          });
        }
      }

      createdChaptersData.push({ ...newChapter, questions: createdQuestions });
    }

    return { success: true, data: createdChaptersData };
  } catch (error) {
    console.error("Error at [createChapters]:", error);
    return { success: false, error: (error as Error).message };
  }
};

interface RevenueCatWebhookEvent {
  product_id: string;
  app_user_id: string;
  price: number;
  price_in_purchased_currency: number;
  currency: string;
  transaction_id: string;
  type: string;
}

interface RevenueCatTransferEvent {
  type: "TRANSFER";
  transferred_from: string[];
  transferred_to: string[];
  app_id: string;
  environment: string;
  event_timestamp_ms: number;
  id: string;
  store: string;
}

export const handlePurchaseWebhook = async ({
  event,
}: {
  event: RevenueCatWebhookEvent | RevenueCatTransferEvent;
}): Promise<Response> => {
  console.log("handlePurchaseWebhook", { event });
  logger.info("handlePurchaseWebhook", { event });

  // Handle TRANSFER events
  if (event.type === "TRANSFER") {
    return handleTransferEvent(event as RevenueCatTransferEvent);
  }

  // Cast to purchase event for regular purchases
  const purchaseEvent = event as RevenueCatWebhookEvent;

  // example of product id: com.intressebevakaren.course.1
  if (
    purchaseEvent.product_id.includes("com.intressebevakaren.course.") ||
    purchaseEvent.product_id.includes("com.intressebevakaren.couse.")
  ) {
    return handleCoursePurchase(purchaseEvent);
  }

  // example of token id: com.intressebevakaren.token.75
  if (
    purchaseEvent.product_id.includes("com.intressebevakaren.token.") ||
    purchaseEvent.product_id.includes("com.intressebevakaren.tokens.")
  ) {
    return handleChatTokensPurchase(purchaseEvent);
  }

  return {
    success: false,
    error: `Unknown product id: ${purchaseEvent.product_id}`,
  };
};

const handleCoursePurchase = async (
  event: RevenueCatWebhookEvent,
): Promise<Response> => {
  try {
    const courseId = Number(event.product_id.split(".").pop());

    console.log("handleCoursePurchase", { courseId, event });

    const userCoursePayload: Omit<
      UserCourse,
      "lastChapterId" | "status" | "createdAt" | "updatedAt"
    > = {
      userId: event.app_user_id,
      courseId,
      accessType: event.price > 0 ? "purchase" : "free",
    };

    console.log("handleCoursePurchase", { userCoursePayload });

    // Check if user already has this course
    const existingUserCourse = await db.query.userCourses.findFirst({
      where: and(
        eq(userCourses.userId, event.app_user_id),
        eq(userCourses.courseId, courseId),
      ),
    });

    if (existingUserCourse) {
      console.log("User already has this course, skipping insert", {
        userId: event.app_user_id,
        courseId,
      });
    } else {
      const userCourse = await db
        .insert(userCourses)
        .values(userCoursePayload)
        .returning({ userId: userCourses.userId });

      if (!userCourse) {
        logger.error("User course creation failed", { userCoursePayload });
        console.error("User course creation failed", { userCoursePayload });

        return { success: false, error: "User course creation failed" };
      }
    }

    const coursePurchasePayload: Omit<CoursePurchase, "id" | "createdAt"> = {
      courseId,
      userId: event.app_user_id,
      price: String(event.price),
      priceInPurchasedCurrency: String(event.price_in_purchased_currency),
      purchasedInCurrency: event.currency,
      type: event.type,
      transactionId: event.transaction_id,
    };

    const coursePurchase = await db
      .insert(coursePurchases)
      .values(coursePurchasePayload)
      .returning({ id: coursePurchases.id });

    if (!coursePurchase) {
      logger.error("Course purchase creation failed", {
        coursePurchasePayload,
      });
      console.error("Course purchase creation failed", {
        coursePurchasePayload,
      });
      return { success: false, error: "Course purchase creation failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [handleCoursePurchase]:", error);
    return { success: false, error: (error as Error).message };
  }
};

const CHAT_TOKENS_PURCHASE_AMOUNTS: Record<number, number> = {
  75: 150000,
};

const handleChatTokensPurchase = async (
  event: RevenueCatWebhookEvent,
): Promise<Response> => {
  try {
    const payloadAmount = Number(event.product_id.split(".").pop());
    const purchaseAmount = CHAT_TOKENS_PURCHASE_AMOUNTS[payloadAmount];

    console.log("handleChatTokensPurchase", { purchaseAmount, event });

    const chatTokensPurchasePayload: Omit<
      ChatTokensPurchase,
      "id" | "createdAt"
    > = {
      userId: event.app_user_id,
      amount: purchaseAmount,
      price: String(event.price),
      priceInPurchasedCurrency: String(event.price_in_purchased_currency),
      purchasedInCurrency: event.currency,
      type: event.type,
      transactionId: event.transaction_id,
    };

    const chatTokensPurchase = await db
      .insert(chatTokensPurchases)
      .values(chatTokensPurchasePayload)
      .returning({ id: chatTokensPurchases.id });

    if (!chatTokensPurchase) {
      logger.error("Chat tokens purchase creation failed", {
        chatTokensPurchasePayload,
      });
      console.error("Chat tokens purchase creation failed", {
        chatTokensPurchase,
      });
      return {
        success: false,
        error: "Chat tokens purchase creation failed",
      };
    }

    const updatedUser = await db
      .update(user)
      .set({
        purchasedChatTokens: sql`purchased_chat_tokens + ${purchaseAmount}`,
      })
      .where(eq(user.id, event.app_user_id))
      .returning({ id: user.id });

    if (!updatedUser) {
      logger.error("User update failed", { event });
      console.error("User update failed", { event });
      return { success: false, error: "User update failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [handleChatTokensPurchase]:", error);
    return { success: false, error: (error as Error).message };
  }
};

const transferCoursePurchase = async (
  purchase: CoursePurchase,
  targetUserId: string,
  eventId: string,
) => {
  // Create course purchase record
  const coursePurchasePayload: Omit<CoursePurchase, "id" | "createdAt"> = {
    courseId: purchase.courseId,
    userId: targetUserId,
    price: String(purchase.price),
    priceInPurchasedCurrency: String(purchase.priceInPurchasedCurrency),
    purchasedInCurrency: purchase.purchasedInCurrency,
    type: "TRANSFER",
    transactionId: `TRANSFER_${eventId}_${purchase.transactionId}`,
  };

  await db.insert(coursePurchases).values(coursePurchasePayload);

  // Check if user already has this course
  const existingUserCourse = await db.query.userCourses.findFirst({
    where: and(
      eq(userCourses.userId, targetUserId),
      eq(userCourses.courseId, purchase.courseId),
    ),
  });

  if (existingUserCourse) {
    console.log("User already has course, skipping course creation", {
      targetUserId,
      courseId: purchase.courseId,
    });
    return;
  }

  // Create user course access
  const userCoursePayload: Omit<
    UserCourse,
    "lastChapterId" | "status" | "createdAt" | "updatedAt"
  > = {
    userId: targetUserId,
    courseId: purchase.courseId,
    accessType: "purchase",
  };

  await db.insert(userCourses).values(userCoursePayload);
  console.log("Created course access for transfer", {
    targetUserId,
    courseId: purchase.courseId,
  });
};

const transferChatTokensPurchases = async (
  purchases: ChatTokensPurchase[],
  targetUserId: string,
  eventId: string,
) => {
  let totalTokensToTransfer = 0;

  for (const purchase of purchases) {
    // Create chat tokens purchase record
    const chatTokensPurchasePayload: Omit<
      ChatTokensPurchase,
      "id" | "createdAt"
    > = {
      userId: targetUserId,
      amount: purchase.amount,
      price: String(purchase.price),
      priceInPurchasedCurrency: String(purchase.priceInPurchasedCurrency),
      purchasedInCurrency: purchase.purchasedInCurrency,
      type: "TRANSFER",
      transactionId: `TRANSFER_${eventId}_${purchase.transactionId}`,
    };

    await db.insert(chatTokensPurchases).values(chatTokensPurchasePayload);
    totalTokensToTransfer += purchase.amount;
  }

  // Update user's chat tokens balance
  if (totalTokensToTransfer > 0) {
    await db
      .update(user)
      .set({
        purchasedChatTokens: sql`purchased_chat_tokens + ${totalTokensToTransfer}`,
      })
      .where(eq(user.id, targetUserId));

    console.log("Updated chat tokens balance for transfer", {
      targetUserId,
      tokensAdded: totalTokensToTransfer,
    });
  }
};

const handleTransferEvent = async (
  event: RevenueCatTransferEvent,
): Promise<Response> => {
  try {
    console.log("handleTransferEvent", { event });
    logger.info("handleTransferEvent", { event });

    // Get the source user (first user in transferred_from array)
    const sourceUserId = event.transferred_from[0];
    if (!sourceUserId) {
      return {
        success: false,
        error: "No source user in transferred_from",
      };
    }

    // Get target users (all users in transferred_to array)
    const targetUserIds = event.transferred_to;
    if (!targetUserIds || targetUserIds.length === 0) {
      return {
        success: false,
        error: "No target users in transferred_to",
      };
    }

    console.log("Transferring purchases", { sourceUserId, targetUserIds });

    // Verify which target users exist in the system
    const existingUsers = await db.query.user.findMany({
      where: inArray(user.id, targetUserIds),
      columns: { id: true },
    });

    const existingUserIds = existingUsers.map((u) => u.id);
    const nonExistingUserIds = targetUserIds.filter(
      (id) => !existingUserIds.includes(id),
    );

    if (nonExistingUserIds.length > 0) {
      console.log("Some target users do not exist in the system", {
        nonExistingUserIds,
      });
      logger.warn("Some target users do not exist in the system", {
        nonExistingUserIds,
      });
    }

    if (existingUserIds.length === 0) {
      return {
        success: false,
        error: "None of the target users exist in the system",
      };
    }

    console.log("Verified target users", {
      requested: targetUserIds.length,
      existing: existingUserIds.length,
      existingUserIds,
    });

    // Get all course purchases from source user
    const sourceCoursesPurchases = await db.query.coursePurchases.findMany({
      where: eq(coursePurchases.userId, sourceUserId),
    });

    // Get all chat token purchases from source user
    const sourceChatTokensPurchases =
      await db.query.chatTokensPurchases.findMany({
        where: eq(chatTokensPurchases.userId, sourceUserId),
      });

    console.log("Found purchases to transfer", {
      coursePurchases: sourceCoursesPurchases.length,
      chatTokensPurchases: sourceChatTokensPurchases.length,
    });

    // Duplicate purchases for each existing target user
    for (const targetUserId of existingUserIds) {
      console.log("Transferring to user", { targetUserId });

      // Transfer course purchases
      for (const purchase of sourceCoursesPurchases) {
        await transferCoursePurchase(purchase, targetUserId, event.id);
      }

      // Transfer chat token purchases
      if (sourceChatTokensPurchases.length > 0) {
        await transferChatTokensPurchases(
          sourceChatTokensPurchases,
          targetUserId,
          event.id,
        );
      }
    }

    logger.info("Transfer completed successfully", {
      sourceUserId,
      requestedTargetUsers: targetUserIds.length,
      processedTargetUsers: existingUserIds.length,
      existingUserIds,
      nonExistingUserIds,
      coursePurchases: sourceCoursesPurchases.length,
      chatTokensPurchases: sourceChatTokensPurchases.length,
    });

    return { success: true };
  } catch (error) {
    console.error("Error at [handleTransferEvent]:", error);
    logger.error("Error at [handleTransferEvent]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const createUserQuestionAnswers = async (
  data: Omit<UserQuestionAnswer, "userId">[],
  userId: string,
  courseId: string,
): Promise<
  Response<{ questionsCount: number; answersCount: number; progress: number }>
> => {
  try {
    const values = data.map((answer) => ({ ...answer, userId }));
    await db.insert(userQuestionAnswers).values(values).returning();

    // Only count questions that have at least one correct option defined
    // These are the questions that require user answers for completion
    const {
      rows: [result],
    } = (await db.execute(sql`
      SELECT
        count(DISTINCT q.question_id) AS "questionsCount",
        count(DISTINCT uqa.question_id) AS "answersCount"
      FROM courses c
      LEFT JOIN chapters ch ON c.course_id = ch.course_id
      LEFT JOIN questions q ON ch.chapter_id = q.chapter_id
      LEFT JOIN question_options qo ON qo.question_id = q.question_id AND qo.is_correct = true
      LEFT JOIN user_question_answers uqa
        ON q.question_id = uqa.question_id AND uqa.user_id = ${userId}
      WHERE c.course_id = ${courseId}
        AND qo.option_id IS NOT NULL
    `)) as { rows: { questionsCount: string; answersCount: string }[] };

    const questionsCount = Number(result.questionsCount);
    const answersCount = Number(result.answersCount);

    // If there are no questions with correct options (read-only course), mark as complete
    // Otherwise, calculate progress based on answered questions
    const isCompleted = questionsCount === 0 || answersCount >= questionsCount;
    const progress =
      questionsCount === 0
        ? 100
        : Number(((answersCount / questionsCount) * 100).toFixed(1));

    if (isCompleted) {
      await db
        .update(userCourses)
        .set({
          status: "completed",
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(
          and(
            eq(userCourses.userId, String(userId)),
            eq(userCourses.courseId, Number(courseId)),
          ),
        );
    }

    return { success: true, data: { questionsCount, answersCount, progress } };
  } catch (error) {
    console.error("Error at [createUserQuestionAnswers]:", error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Upsert user question answers: insert new answers, update existing ones
 */
export const upsertUserQuestionAnswers = async (
  data: UserQuestionAnswer[],
  userId: string,
  courseId: string,
): Promise<Response> => {
  try {
    for (const answer of data) {
      const existing = await db.query.userQuestionAnswers.findFirst({
        where: and(
          eq(userQuestionAnswers.userId, String(userId)),
          eq(userQuestionAnswers.questionId, Number(answer.questionId)),
        ),
      });
      if (existing) {
        await db
          .update(userQuestionAnswers)
          .set({ option_id: answer.option_id, updatedAt: new Date() })
          .where(
            and(
              eq(userQuestionAnswers.userId, String(userId)),
              eq(userQuestionAnswers.questionId, Number(answer.questionId)),
            ),
          );
      } else {
        await db.insert(userQuestionAnswers).values({
          ...answer,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
        });
      }
    }

    // Only count questions that have at least one correct option defined
    // These are the questions that require user answers for completion
    const {
      rows: [result],
    } = (await db.execute(sql`
      SELECT
        count(DISTINCT q.question_id) AS "questionsCount",
        count(DISTINCT uqa.question_id) AS "answersCount"
      FROM courses c
      LEFT JOIN chapters ch ON c.course_id = ch.course_id
      LEFT JOIN questions q ON ch.chapter_id = q.chapter_id
      LEFT JOIN question_options qo ON qo.question_id = q.question_id AND qo.is_correct = true
      LEFT JOIN user_question_answers uqa
        ON q.question_id = uqa.question_id AND uqa.user_id = ${userId}
      WHERE c.course_id = ${courseId}
        AND qo.option_id IS NOT NULL
    `)) as { rows: { questionsCount: string; answersCount: string }[] };

    const questionsCount = Number(result?.questionsCount ?? 0);
    const answersCount = Number(result?.answersCount ?? 0);

    console.log("[upsertUserQuestionAnswers] Course completion check:", {
      courseId,
      userId,
      questionsCount,
      answersCount,
      result,
    });

    // If there are no questions (read-only course), mark as completed
    // Otherwise, calculate progress based on answered questions
    const isCompleted = questionsCount === 0 || answersCount >= questionsCount;

    console.log("[upsertUserQuestionAnswers] isCompleted:", isCompleted);

    // Always update status to completed if course is done
    // This also handles read-only courses with no questions
    if (isCompleted) {
      // Check if userCourse record exists
      const existingUserCourse = await db.query.userCourses.findFirst({
        where: and(
          eq(userCourses.userId, String(userId)),
          eq(userCourses.courseId, Number(courseId)),
        ),
      });

      if (existingUserCourse) {
        await db
          .update(userCourses)
          .set({
            status: "completed",
            updatedAt: new Date(),
            completedAt: new Date(),
          })
          .where(
            and(
              eq(userCourses.userId, String(userId)),
              eq(userCourses.courseId, Number(courseId)),
            ),
          );
      } else {
        // Create the userCourse record if it doesn't exist
        // This can happen for free courses accessed directly
        const course = await db.query.courses.findFirst({
          where: eq(courses.courseId, Number(courseId)),
          columns: { price: true },
        });

        await db.insert(userCourses).values({
          userId: String(userId),
          courseId: Number(courseId),
          status: "completed",
          accessType: course?.price === 0 ? "free" : "purchase",
          completedAt: new Date(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [upsertUserQuestionAnswers]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const shareCourseWithCustomer = async (
  data: CustomerCourse,
): Promise<Response> => {
  try {
    // share course with customer
    const [{ courseId, customerId }] = await db
      .insert(customerCourses)
      .values(data)
      .returning({
        courseId: customerCourses.courseId,
        customerId: customerCourses.customerId,
      });

    if (!courseId || !customerId) {
      return { success: false, error: "Bad Request" };
    }

    // users who have a license and do not have the given course
    const assignableUsers = await getAssignableUsersForCourse(
      customerId,
      courseId,
    );

    // automatically share course with all the customer users (if any)
    if (assignableUsers.data?.length) {
      const values = assignableUsers.data.map((user) => ({
        userId: user.id,
        courseId,
        customerId,
        accessType: userCoursesAccessType.enumValues[2], // organization
      }));

      await db.insert(userCourses).values(values);
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [shareCourseWithCustomer]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const shareAllCustomerCoursesWithNewUsers = async (
  customerId: string,
  userIds: string[],
) => {
  try {
    // Get all courses for the customer
    const courses = await db.query.customerCourses.findMany({
      where: eq(customerCourses.customerId, customerId),
    });

    if (courses.length) {
      const values = courses.flatMap((course) =>
        userIds.map((userId) => ({
          userId,
          courseId: course.courseId,
          customerId,
          accessType: userCoursesAccessType.enumValues[2], // organization
        })),
      );

      await db.insert(userCourses).values(values);
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [shareAllCustomerCoursesWithNewUsers]:", error);
    return { success: false, error: (error as Error).message };
  }
};

// --- DELETE ---

export const deleteCourseById = async (id: number): Promise<Response> => {
  try {
    const { rowCount } = await db
      .delete(courses)
      .where(eq(courses.courseId, id));

    if (rowCount === 0) {
      return { success: false, error: "Bad request" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [deleteCourseById]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const deleteCourseChaptersByIds = async (
  chapterIds: number[] = [],
): Promise<Response> => {
  try {
    const { rowCount } = await db
      .delete(chapters)
      .where(inArray(chapters.chapterId, chapterIds));

    if (rowCount === 0) {
      return { success: false, error: "Bad request" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [deleteCourseChaptersByIds]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const deleteChapterQuestionsByIds = async (
  questionIds: number[] = [],
): Promise<Response> => {
  try {
    const { rowCount } = await db
      .delete(questions)
      .where(inArray(questions.questionId, questionIds));

    if (rowCount === 0) {
      return { success: false, error: "Bad request" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [deleteChapterQuestionsByIds]:", error);
    return { success: false, error: (error as Error).message };
  }
};

// --- UPDATE ---

export const updateUserQuestionAnswers = async (
  data: UserQuestionAnswer[],
): Promise<Response> => {
  try {
    for (const answer of data) {
      await db
        .update(userQuestionAnswers)
        .set({ option_id: answer.option_id, updatedAt: new Date() })
        .where(
          and(
            eq(userQuestionAnswers.userId, String(answer.userId)),
            eq(userQuestionAnswers.questionId, Number(answer.questionId)),
          ),
        );
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [updateUserQuestionAnswers]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const updateUserCourseStatus = async (
  data: Pick<UserCourse, "status" | "userId" | "courseId">,
): Promise<Response> => {
  try {
    const course = await db.query.userCourses.findFirst({
      where: and(
        eq(userCourses.userId, String(data.userId)),
        eq(userCourses.courseId, Number(data.courseId)),
      ),
    });

    if (!course?.courseId) {
      // Check if the course exists and has price 0
      const actualCourse = await db.query.courses.findFirst({
        where: eq(courses.courseId, Number(data.courseId)),
        columns: {
          courseId: true,
          price: true,
        },
      });

      if (!actualCourse) {
        return { success: false, error: "Course Not Found" };
      }

      if (actualCourse.price === 0) {
        // Check if this is a read-only course (no questions)
        let statusToSet = data.status;
        if (data.status === "in_progress") {
          const {
            rows: [result],
          } = (await db.execute(sql`
            SELECT count(q.question_id) AS "questionsCount"
            FROM courses c
            LEFT JOIN chapters ch ON c.course_id = ch.course_id
            LEFT JOIN questions q ON ch.chapter_id = q.chapter_id
            WHERE c.course_id = ${data.courseId}
          `)) as { rows: { questionsCount: string }[] };

          const questionsCount = Number(result?.questionsCount ?? 0);
          // If no questions, mark as completed instead of in_progress
          if (questionsCount === 0) {
            statusToSet = "completed";
          }
        }

        // Create a new user course for free courses
        await db.insert(userCourses).values({
          userId: String(data.userId),
          courseId: Number(data.courseId),
          status: statusToSet,
          accessType: "free",
          completedAt: statusToSet === "completed" ? new Date() : null,
        });

        return { success: true };
      }

      return { success: false, error: "Not Found" };
    }

    // in this case we reset (remove) user course data (answers)
    // so user can start a course again
    if (course?.status === "completed" && data.status === "in_progress") {
      // Delete all user answers for questions in this course using a single batch operation
      await db.execute(sql`
        DELETE FROM user_question_answers
        WHERE user_id = ${data.userId}
          AND question_id IN (
            SELECT q.question_id
            FROM questions q
            JOIN chapters ch ON q.chapter_id = ch.chapter_id
            WHERE ch.course_id = ${data.courseId}
          )
      `);
    }

    // Determine the final status to set
    let finalStatus = data.status;

    // For read-only courses (no questions), automatically mark as completed
    // when the status is being set to in_progress (user opened the course)
    if (data.status === "in_progress") {
      const {
        rows: [result],
      } = (await db.execute(sql`
        SELECT count(q.question_id) AS "questionsCount"
        FROM courses c
        LEFT JOIN chapters ch ON c.course_id = ch.course_id
        LEFT JOIN questions q ON ch.chapter_id = q.chapter_id
        WHERE c.course_id = ${data.courseId}
      `)) as { rows: { questionsCount: string }[] };

      const questionsCount = Number(result?.questionsCount ?? 0);

      // If no questions, mark as completed instead of in_progress
      // test
      if (questionsCount === 0) {
        finalStatus = "completed";
      }
    }

    await db
      .update(userCourses)
      .set({
        status: finalStatus,
        updatedAt: new Date(),
        completedAt: finalStatus === "completed" ? new Date() : null,
      })
      .where(
        and(
          eq(userCourses.userId, String(data.userId)),
          eq(userCourses.courseId, Number(data.courseId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error at [updateUserCourseStatus]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export interface UpdateCoursePayload {
  courseId: number;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number;
  status?: (typeof coursesStatusEnum.enumValues)[number];
  certificateEnabled?: boolean;
}

export const updateCourseById = async (
  data: UpdateCoursePayload,
): Promise<Response<Course>> => {
  try {
    const { courseId, ...courseFieldsToUpdate } = data;

    if (Object.keys(courseFieldsToUpdate).length === 0) {
      return { success: false, error: "Bad Request" };
    }

    const result = await db
      .update(courses)
      .set({
        ...courseFieldsToUpdate,
        updatedAt: new Date(),
      })
      .where(eq(courses.courseId, courseId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Not Found" };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Error at [updateCourseById]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export interface UpdateChapterPayload {
  chapterId: number;
  title?: string;
  description?: string | null;
  videoUrl?: string;
  order?: number;
}

export const updateChapterById = async (
  data: UpdateChapterPayload,
): Promise<Response<Chapter>> => {
  try {
    const { chapterId, ...chapterFieldsToUpdate } = data;

    if (Object.keys(chapterFieldsToUpdate).length === 0) {
      return { success: false, error: "No data" };
    }

    const result = await db
      .update(chapters)
      .set({
        ...chapterFieldsToUpdate,
        updatedAt: new Date(),
      })
      .where(eq(chapters.chapterId, chapterId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "No chapter" };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Error [updateChapterById]:", error);
    return { success: false, error: (error as Error).message };
  }
};

type InsertQuestionOptionPayload = Omit<
  InferInsertModel<typeof questionOptions>,
  "optionId" | "questionId" | "createdAt" | "updatedAt"
> & {
  text: string;
  isCorrect?: boolean;
};

export interface UpdateQuestionPayload {
  questionId: number;
  chapterId?: number | null;
  text?: string;
  description?: string | null;
  feedback?: string | null;
  type?: (typeof questionsTypeEnum.enumValues)[number];
  options?: InsertQuestionOptionPayload[];
}

export const updateQuestions = async (
  data: UpdateQuestionPayload[],
): Promise<Response> => {
  try {
    for (const questionData of data) {
      const { questionId, options, ...questionFieldsToUpdate } = questionData;
      if (Object.keys(questionFieldsToUpdate).length > 0) {
        await db
          .update(questions)
          .set({
            ...questionFieldsToUpdate,
            updatedAt: new Date(),
          })
          .where(eq(questions.questionId, questionId));
      }

      if (options) {
        await db
          .delete(questionOptions)
          .where(eq(questionOptions.questionId, questionId));

        if (options.length > 0) {
          const newOptionsToInsert = options.map((option) => ({
            questionId: questionId,
            text: option.text,
            isCorrect: option.isCorrect ?? false,
          }));

          if (newOptionsToInsert.length > 0) {
            await db.insert(questionOptions).values(newOptionsToInsert);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error at [updateQuestions]:", error);
    return { success: false, error: (error as Error).message };
  }
};

export interface CreateQuestionPayload {
  chapterId: number;
  text: string;
  type?: string;
  description?: string | null;
  feedback?: string | null;
  options?: InsertQuestionOptionPayload[];
}

export const createQuestionsForChapter = async (
  data: CreateQuestionPayload[],
): Promise<Response<Question[]>> => {
  try {
    const createdQuestions: Question[] = [];

    for (const questionData of data) {
      const { options, ...questionFields } = questionData;

      const [newQuestion] = await db
        .insert(questions)
        .values({
          ...questionFields,
          type:
            (questionFields.type as QuestionType) ||
            QuestionType.multiple_choice,
        })
        .returning();

      let createdOptions: QuestionOption[] = [];
      if (options && options.length > 0) {
        const newOptionsToInsert = options.map((option) => ({
          questionId: newQuestion.questionId,
          text: option.text,
          isCorrect: option.isCorrect ?? false,
        }));

        createdOptions = await db
          .insert(questionOptions)
          .values(newOptionsToInsert)
          .returning();
      }

      createdQuestions.push({
        ...newQuestion,
        type: newQuestion.type as QuestionType,
        options: createdOptions,
      });
    }

    return { success: true, data: createdQuestions };
  } catch (error) {
    console.error("Error at [createQuestionsForChapter]:", error);
    return { success: false, error: (error as Error).message };
  }
};
