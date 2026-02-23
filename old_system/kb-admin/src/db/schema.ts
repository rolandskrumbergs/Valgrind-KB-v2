import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  numeric,
  varchar,
  uuid,
  json,
  primaryKey,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import type { LenaProfile } from "./queries/lena-queries";
import { relations } from "drizzle-orm";

/**
 *
 * --- ENUMS ---
 *
 */

export const userRoles = pgEnum("user_roles", ["admin", "user"]);

export const documentCategoryEnum = pgEnum("document_category", [
  "books",
  "laws",
  "legalcases",
  "other",
]);

export const processingStatusEnum = pgEnum("processing_status", [
  "uploaded",
  "downloading",
  "partitioning",
  "cleaning",
  "chunking",
  "embedding",
  "indexing",
  "completed",
  "failed",
]);

export const newsStatusEnum = pgEnum("news_status", ["draft", "published"]);

export const coursesStatusEnum = pgEnum("courses_status", [
  "draft",
  "published",
]);

export const questionsTypeEnum = pgEnum("questions_type", ["multiple_choice"]);

export const userCoursesStatus = pgEnum("user_courses_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const userCoursesAccessType = pgEnum("user_courses_access_type", [
  "free", // course without price
  "purchase", // course with price
  "organization", // course shared by org
]);

/**
 *
 * --- TABLES ---
 *
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: userRoles("role").notNull(),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  customerId: uuid("customer_id").references(() => customersTable.id, {
    onDelete: "set null",
  }),
  purchasedChatTokens: integer("purchased_chat_tokens").notNull().default(0),
  securityNumber: text("security_number"),
  invited: boolean("invited").notNull().default(false),
  invitationAccepted: boolean("invitation_accepted").notNull().default(false),
  invitationAcceptedAt: timestamp("invitation_accepted_at"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const customersTable = pgTable("customers", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  contactInfo: text("contact_info").notNull(),
  invoiceInfo: text("invoice_info").notNull(),
  licenses: integer("licenses").notNull(),
  users: integer("users").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const licensesTable = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    activated: boolean("activated").notNull().default(true),
  },
  (table) => ({
    userCustomerUnique: unique("licenses_user_customer_unique").on(
      table.userId,
      table.customerId,
    ),
  }),
);

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expoPushToken: text("expo_push_token").notNull().unique(),
  platform: varchar("platform", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chat = pgTable("chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("created_at").notNull(),
  title: text("title").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const message = pgTable("message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  createdAt: timestamp("created_at").notNull(),
  lenaProfile: json("lena_profile").$type<LenaProfile>(),
});

export const knowledgeBaseInvocations = pgTable("knowledge_base_invocations", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  messageId: text("message_id").notNull(),
  chatId: text("chat_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  searchQuery: text("search_query").notNull(),
  conversationSummary: text("conversation_summary").notNull(),
  result: text("result").notNull(),
  status: text("status").notNull(),
  type: text("type"),
  fetchedChunks: json("fetched_chunks").notNull(),
  metrics: json("metrics").notNull(),
  createdAt: timestamp("created_at").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  model: text("model").notNull(),
  lenaProfile: json("lena_profile").$type<LenaProfile>(),
});

export const lenaProfiles = pgTable("lena_profiles", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  active: boolean("active").notNull().default(false),
  profileName: text("profile_name").unique(),
  topK: integer("top_k").notNull(),
  model: text("model").notNull(),
  threshold: integer("threshold").notNull(),
  thresholdRequiredChunks: integer("threshold_required_chunks").notNull(),
  highConfidenceThreshold: integer("high_confidence_threshold").notNull(),
  requiredHighConfidenceChunks: integer(
    "required_high_confidence_chunks",
  ).notNull(),
  createdAt: timestamp("created_at").notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdByName: text("created_by_name").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedByName: text("updated_by_name").notNull(),
});

export const lenaStarterQuestions = pgTable("lena_starter_questions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  question: text("question").notNull(),
});

export const vote = pgTable(
  "vote",
  {
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("message_id")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("is_upvoted").notNull(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.messageId] })],
);

export const tokenUsage = pgTable("token_usage", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id").references(() => chat.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => message.id, {
    onDelete: "set null",
  }),
  promptTokens: integer("prompt_tokens").notNull(),
  completionTokens: integer("completion_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  createdAt: timestamp("created_at").notNull(),
  model: text("model"),
  lenaProfile: json("lena_profile").$type<LenaProfile>(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
});

export const ibbenLenaKnowledgeFiles = pgTable("ibben_lena_knowledge_files", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  category: documentCategoryEnum("category").notNull(),
  s3Key: text("s3_key").notNull(),
  s3Url: text("s3_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  fileHash: text("file_hash").notNull().unique(),
  active: boolean("active").default(true).notNull(),
  userName: text("user_name"),
  userRole: text("user_role"),
  processingStatus: processingStatusEnum("processing_status")
    .notNull()
    .default("uploaded"),
  currentStageProgress: json("current_stage_progress").$type<{
    stage: string;
    progress: number;
    startedAt: string;
    message?: string;
  }>(),
  errorMessage: text("error_message"),
  totalChunks: integer("total_chunks"),
  totalIndexedChunks: integer("total_indexed_chunks"),
  totalFailedChunks: integer("total_failed_chunks"),
  processingTime: json("processing_time").$type<{
    download: number;
    partition: number;
    clean: number;
    chunk: number;
    embed: number;
    index: number;
    total: number;
  }>(),
  chunkMetrics: json("chunk_metrics").$type<{
    avgSize: number;
    maxSize: number;
    minSize: number;
    totalChunks: number;
    chunkingConfig: Record<string, unknown>;
  }>(),
  embeddingResults: json("embedding_results").$type<{
    totalEmbedded: number;
    embeddingModel: string;
    embeddingDimension: number;
    chunksSample: Array<{
      text: string;
      type: string;
      size: number;
      embedding_dimension: number;
      embedding_model: string;
    }>;
  }>(),
  indexingResults: json("indexing_results").$type<{
    totalChunks: number;
    indexedChunks: number;
    failedChunks: number;
    indexingStats: Record<string, unknown>;
  }>(),
  processingMessage: text("processing_message"),
  chunkSet: text("chunk_set").default("set_a"),
});

export const newsTable = pgTable("news", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  pdfFiles: json("pdf_files")
    .$type<
      Array<{
        fileName: string;
        fileSize: number;
        s3Key: string;
        s3Url: string;
      }>
    >()
    .default([]),
  excludedCustomers: json("excluded_customers").$type<string[]>().default([]),
  status: newsStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userName: text("user_name"),
  userRole: text("user_role"),
});

export const courses = pgTable("courses", {
  courseId: serial("course_id").primaryKey(),
  uuid: uuid("uuid").notNull().defaultRandom().unique(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price").notNull().default(0),
  currency: text("currency").notNull(),
  status: coursesStatusEnum("status").notNull().default("draft"),
  certificateEnabled: boolean("certificate_enabled").notNull().default(true),
  creatorId: text("creator_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  chapterId: serial("chapter_id").primaryKey(),
  courseId: integer("course_id").references(() => courses.courseId, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  questionId: serial("question_id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.chapterId, {
    onDelete: "cascade",
  }),
  type: questionsTypeEnum("type").notNull().default("multiple_choice"),
  text: text("text").notNull(),
  description: text("description"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questionOptions = pgTable("question_options", {
  optionId: serial("option_id").primaryKey(),
  questionId: integer("question_id").references(() => questions.questionId, {
    onDelete: "cascade",
  }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerCourses = pgTable(
  "customer_courses",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    courseId: integer("course_id").references(() => courses.courseId, {
      onDelete: "cascade",
    }),
    sharedByUserId: text("shared_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.customerId, table.courseId] })],
);

export const userCourses = pgTable(
  "user_courses",
  {
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    courseId: integer("course_id").references(() => courses.courseId, {
      onDelete: "cascade",
    }),
    lastChapterId: integer("last_chapter_id").references(
      () => chapters.chapterId,
      { onDelete: "set null" },
    ),
    customerId: uuid("customer_id").references(() => customersTable.id, {
      onDelete: "cascade",
    }),
    status: userCoursesStatus("status").notNull().default("not_started"),
    accessType: userCoursesAccessType("access_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    certificateId: text("certificate_id").unique(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId] })],
);

export const userQuestionAnswers = pgTable(
  "user_question_answers",
  {
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id").references(() => questions.questionId, {
      onDelete: "cascade",
    }),
    option_id: integer("option_id").references(() => questionOptions.optionId, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.questionId] })],
);

export const coursePurchases = pgTable("course_purchases", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.courseId, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 10, scale: 3 }), // from revenuecat
  priceInPurchasedCurrency: numeric("price_in_purchased_currency", {
    precision: 10,
    scale: 3,
  }), // from revenuecat
  purchasedInCurrency: text("purchased_in_currency").notNull(), // from revenuecat
  type: text("type").notNull(), // from revenuecat
  transactionId: text("transaction_id").notNull(), // from revenuecat
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatTokensPurchases = pgTable("chat_tokens_purchases", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  price: numeric("price", { precision: 10, scale: 3 }), // from revenuecat
  priceInPurchasedCurrency: numeric("price_in_purchased_currency", {
    precision: 10,
    scale: 3,
  }), // from revenuecat
  purchasedInCurrency: text("purchased_in_currency").notNull(), // from revenuecat
  type: text("type").notNull(), // from revenuecat
  transactionId: text("transaction_id").notNull(), // from revenuecat
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 *
 * --- RELATIONS ---
 *
 */

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  chats: many(chat),
  tokenUsages: many(tokenUsage),
  lenaProfilesCreated: many(lenaProfiles, { relationName: "createdBy" }),
  lenaProfilesUpdated: many(lenaProfiles, { relationName: "updatedBy" }),
  customer: one(customersTable, {
    fields: [user.customerId],
    references: [customersTable.id],
  }),
  licenses: many(licensesTable),
  courses: many(userCourses),
  questionAnswers: many(userQuestionAnswers),
  sharedToCustomers: many(customerCourses),
  coursePurchases: many(coursePurchases),
  chatTokensPurchases: many(chatTokensPurchases),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const customerRelations = relations(customersTable, ({ many }) => ({
  users: many(user),
  licenses: many(licensesTable),
  courses: many(customerCourses),
}));

export const licenseRelations = relations(licensesTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [licensesTable.customerId],
    references: [customersTable.id],
  }),
  user: one(user, {
    fields: [licensesTable.userId],
    references: [user.id],
  }),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(message),
  votes: many(vote),
  tokenUsages: many(tokenUsage),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
  votes: many(vote),
  tokenUsages: many(tokenUsage),
}));

export const voteRelations = relations(vote, ({ one }) => ({
  chat: one(chat, {
    fields: [vote.chatId],
    references: [chat.id],
  }),
  message: one(message, {
    fields: [vote.messageId],
    references: [message.id],
  }),
}));

export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
  chat: one(chat, {
    fields: [tokenUsage.chatId],
    references: [chat.id],
  }),
  message: one(message, {
    fields: [tokenUsage.messageId],
    references: [message.id],
  }),
  user: one(user, {
    fields: [tokenUsage.userId],
    references: [user.id],
  }),
}));

export const lenaProfileRelations = relations(lenaProfiles, ({ one }) => ({
  createdBy: one(user, {
    fields: [lenaProfiles.createdBy],
    references: [user.id],
    relationName: "createdBy",
  }),
  updatedBy: one(user, {
    fields: [lenaProfiles.updatedBy],
    references: [user.id],
    relationName: "updatedBy",
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(user, {
    fields: [courses.creatorId],
    references: [user.id],
  }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.courseId],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [questions.chapterId],
    references: [chapters.chapterId],
  }),
  options: many(questionOptions),
}));

export const questionOptionsRelations = relations(
  questionOptions,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionOptions.questionId],
      references: [questions.questionId],
    }),
  }),
);

export const customerCoursesRelations = relations(
  customerCourses,
  ({ one }) => ({
    customer: one(customersTable, {
      fields: [customerCourses.customerId],
      references: [customersTable.id],
    }),
    course: one(courses, {
      fields: [customerCourses.courseId],
      references: [courses.courseId],
    }),
    sharedByUser: one(user, {
      fields: [customerCourses.sharedByUserId],
      references: [user.id],
    }),
  }),
);

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(user, {
    fields: [userCourses.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.courseId],
  }),
  lastChapter: one(chapters, {
    fields: [userCourses.lastChapterId],
    references: [chapters.chapterId],
  }),
  customer: one(customersTable, {
    fields: [userCourses.customerId],
    references: [customersTable.id],
  }),
}));

export const userQuestionAnswersRelations = relations(
  userQuestionAnswers,
  ({ one }) => ({
    user: one(user, {
      fields: [userQuestionAnswers.userId],
      references: [user.id],
    }),
    question: one(questions, {
      fields: [userQuestionAnswers.questionId],
      references: [questions.questionId],
    }),
    option: one(questionOptions, {
      fields: [userQuestionAnswers.option_id],
      references: [questionOptions.optionId],
    }),
  }),
);

export const coursePurchasesRelations = relations(
  coursePurchases,
  ({ one }) => ({
    user: one(user, {
      fields: [coursePurchases.userId],
      references: [user.id],
    }),
    course: one(courses, {
      fields: [coursePurchases.courseId],
      references: [courses.courseId],
    }),
  }),
);

export const chatTokensPurchasesRelations = relations(
  chatTokensPurchases,
  ({ one }) => ({
    user: one(user, {
      fields: [chatTokensPurchases.userId],
      references: [user.id],
    }),
  }),
);

export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;
export type Customer = InferSelectModel<typeof customersTable>;
export type License = InferSelectModel<typeof licensesTable>;
export type PushToken = InferSelectModel<typeof pushTokens>;

export type LicenseWithUser = License & {
  user: InferSelectModel<typeof user> | null;
};

export type LicenseWithUserAndCustomer = License & {
  user: InferSelectModel<typeof user> | null;
  customer: InferSelectModel<typeof customersTable>;
};
export type Chat = InferSelectModel<typeof chat>;
export type IbbenLenaKnowledgeFile = InferSelectModel<
  typeof ibbenLenaKnowledgeFiles
>;
export type News = InferSelectModel<typeof newsTable>;
export type Message = InferSelectModel<typeof message>;
export type Vote = InferSelectModel<typeof vote>;
export type TokenUsage = InferSelectModel<typeof tokenUsage>;
export type KnowledgeBaseInvocation = InferSelectModel<
  typeof knowledgeBaseInvocations
>;
export type LenaProfiles = InferSelectModel<typeof lenaProfiles>;
