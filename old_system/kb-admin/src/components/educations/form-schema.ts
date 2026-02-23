import { z } from "zod";

// Original Zod schemas (assuming these are for DB interaction, may not have tempId)
export const ZodOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text cannot be empty."),
  isCorrect: z.boolean(),
});

export const ZodQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text cannot be empty."),
  description: z.string().optional(), // Added based on ChapterSubForm usage
  feedback: z.string().optional(), // Added based on ChapterSubForm usage
  options: z.array(ZodOptionSchema).min(1, "At least one option is required."), // Assuming min 1 option
});

export const ZodChapterSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Chapter title must be at least 3 characters."),
  description: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")), // Allow empty string or valid URL
  order: z.coerce
    .number()
    .int("Order must be a whole number.")
    .min(0, "Order must be 0 or greater."),
  // courseId: z.number(), // Not part of chapter sub-form data directly, passed separately
  questions: z.array(ZodQuestionSchema).optional(),
});

// Client-side specific schemas for react-hook-form, incorporating tempId
export const ClientOptionFormSchema = ZodOptionSchema.extend({});

export type ClientOptionFormData = z.infer<typeof ClientOptionFormSchema>;

export const ClientQuestionFormSchema = ZodQuestionSchema.extend({
  options: z.array(ClientOptionFormSchema),
});

export type ClientQuestionFormData = z.infer<typeof ClientQuestionFormSchema>;

export const ClientChapterFormSchema = ZodChapterSchema.extend({
  questions: z.array(ClientQuestionFormSchema).optional(), // Make questions array optional on the form level
});
export type ClientChapterFormData = z.infer<typeof ClientChapterFormSchema>;

export const BasicCourseInfoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."), // coerce to number
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")), // Allow empty string or valid URL
  status: z.enum(["draft", "published"]),
  certificateEnabled: z.boolean().default(true),
});
export type BasicCourseInfoFormData = z.infer<typeof BasicCourseInfoSchema>;
