// chapter-form.tsx
"use client";
import React from "react";
import { useFormStatus } from "react-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import OptionsForm from "./options-form";

import { ClientChapterFormSchema, ClientChapterFormData } from "./form-schema";

function SubmitButton({
  text,
  pendingText,
  className,
  variant,
}: {
  readonly text: string;
  readonly pendingText: string;
  readonly className?: string;
  readonly variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
}) {
  const { pending } = useFormStatus(); // This hook is for server actions. For client-side RHF submit, use RHF's isSubmitting
  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      variant={variant ?? undefined}
    >
      {pending ? (
        <>
          {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
          {pendingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}

// Extended type to include database and UI tracking properties
export type ChapterClientState = z.infer<typeof ClientChapterFormSchema> & {
  chapterId?: number;
  tempId?: string;
};

interface ChapterFormProps {
  readonly chapterInitialData: ChapterClientState;
  readonly onSave: (formData: any) => void;
  readonly onCancel: () => void;
  readonly isSubmitting?: boolean;
  readonly serverError?: string | null;
  readonly serverFieldErrors?: any;
}

function ChapterForm({
  chapterInitialData,
  onSave,
  onCancel,
  isSubmitting,
  serverError,
  serverFieldErrors,
}: ChapterFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors, isSubmitting: rhfIsSubmitting }, // RHF's own isSubmitting
  } = useForm<ClientChapterFormData>({
    resolver: zodResolver(ClientChapterFormSchema),
    defaultValues: structuredClone(chapterInitialData),
  });

  const { pending: serverActionIsPending } = useFormStatus();
  const isActuallySubmitting =
    rhfIsSubmitting || serverActionIsPending || isSubmitting;

  const {
    fields: questions,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: "questions",
    keyName: "fieldId",
  });

  const onSubmitChapter: SubmitHandler<ClientChapterFormData> = (data) => {
    const payload = {
      chapterId: chapterInitialData?.chapterId,
      ...data,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitChapter)} className="space-y-6 py-2">
      <Card>
        <CardHeader>
          <CardTitle>Chapter Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={`chap-title-${chapterInitialData.tempId}`}>
              Chapter Title
            </Label>
            <Input
              id={`chap-title-${chapterInitialData.tempId}`}
              {...register("title")}
              placeholder="e.g., Introduction to React"
            />
            {clientErrors.title && (
              <p className="text-sm text-destructive mt-1">
                {clientErrors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`chap-desc-${chapterInitialData.tempId}`}>
              Description (Optional)
            </Label>
            <Textarea
              id={`chap-desc-${chapterInitialData.tempId}`}
              {...register("description")}
              rows={3}
              placeholder="A brief overview of this chapter's content."
            />
            {clientErrors.description && (
              <p className="text-sm text-destructive mt-1">
                {clientErrors.description.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`chap-video-${chapterInitialData.tempId}`}>
              Video URL (Optional)
            </Label>
            <Input
              type="url"
              id={`chap-video-${chapterInitialData.tempId}`}
              {...register("videoUrl")}
              placeholder="https://example.com/video.mp4"
            />
            {clientErrors.videoUrl && (
              <p className="text-sm text-destructive mt-1">
                {clientErrors.videoUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`chap-order-${chapterInitialData.tempId}`}>
              Order
            </Label>
            <Input
              type="number"
              id={`chap-order-${chapterInitialData.tempId}`}
              {...register("order")}
              placeholder="0"
              min="0"
              step="1"
            />
            {clientErrors.order && (
              <p className="text-sm text-destructive mt-1">
                {clientErrors.order.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add interactive questions to this chapter.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendQuestion({
                  id: `q-${Date.now()}`,
                  text: "",
                  description: "",
                  feedback: "",
                  options: [
                    { id: `opt-${Date.now()}`, text: "", isCorrect: true },
                  ],
                })
              }
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clientErrors.questions &&
            typeof clientErrors.questions.message === "string" && (
              <p className="text-sm text-destructive mb-2">
                {clientErrors.questions.message}
              </p>
            )}
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No questions added for this chapter yet.
            </p>
          ) : (
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 -mr-2">
              {" "}
              {/* Scroll for questions list if long */}
              {questions.map((questionField, qIndex) => (
                <Card key={questionField.fieldId} className="bg-muted/30 p-1">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">
                        Question {qIndex + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-3">
                    <div>
                      <Label htmlFor={`q-text-${questionField.id}`}>
                        Question Text
                      </Label>
                      <Textarea
                        id={`q-text-${questionField.id}`}
                        {...register(`questions.${qIndex}.text` as const)}
                        rows={2}
                        placeholder="Enter question text"
                      />
                      {clientErrors.questions?.[qIndex]?.text && (
                        <p className="text-sm text-destructive mt-1">
                          {clientErrors.questions[qIndex]?.text?.message}
                        </p>
                      )}
                    </div>
                    <OptionsForm
                      prefix={`questions.${qIndex}.options`}
                      control={control}
                      register={register} // Pass down register
                      errors={clientErrors.questions?.[qIndex]?.options as any} // Type assertion might be needed
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-3 border-t -mx-6 px-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isActuallySubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isActuallySubmitting}>
          {isActuallySubmitting ? (
            <>Saving...</>
          ) : (
            getSubmitButtonText(chapterInitialData.id)
          )}
        </Button>
      </div>
    </form>
  );
}

function getSubmitButtonText(chapterId?: string) {
  return chapterId ? "Save Changes" : "Add Chapter";
}

export default ChapterForm;
