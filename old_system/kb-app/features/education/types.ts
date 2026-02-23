export type CourseStatus = "not_started" | "in_progress" | "completed";

export type UserCourseStatus = "not_started" | "in_progress" | "completed";

export interface Option {
  optionId: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  questionId: string;
  chapterId: string;
  type: "multiple_choice";
  text: string;
  description?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  userAnswerOptionIds: string[];
  options: Option[];
}

export interface Chapter {
  chapterId: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface Course {
  courseId: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  status: CourseStatus;
  userCourseStatus: UserCourseStatus;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  certificateEnabled: boolean;
  score: number | null;
  passed: boolean | null;
  requiredScore: number;
  amountOfQuestions?: number;
  completedAt?: string;
}

export interface UserCompletedCourseDetails {
  courseId: number;
  uuid?: string;
  title: string;
  completedOn: Date;
  score: number | null;
  passed: boolean;
  certificateId?: string | null;
  certificateEnabled: boolean;
  eligibleForCertificate: boolean;
  requiredScore: number;
}
