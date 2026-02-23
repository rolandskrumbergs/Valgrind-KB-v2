"use client";

import React, { useState } from "react";
import { PlusCircle, Edit3, Trash2, ListVideo } from "lucide-react";
import { toast } from "sonner";
import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";

import ChapterForm from "./chapter-form";
import {
  deleteCourseChapters,
  createChaptersAction,
  updateChapterAction,
  createChapterQuestionsAction,
  updateQuestionsAction,
  deleteChapterQuestions,
} from "@/actions/courses-actions";
import {
  ClientChapterFormSchema,
  type ClientChapterFormData,
} from "./form-schema";
import type { Chapter } from "@/db/queries/course-queries";

// Extended chapter state that includes chapterId and tempId for UI tracking
export type ChapterClientState = z.infer<typeof ClientChapterFormSchema> & {
  chapterId?: number;
  tempId?: string;
};

// Define state types for server action responses
type ActionResponseState<TData = any, TFieldErrors = any> = {
  success: boolean;
  message?: string;
  error?: string;
  errors?: TFieldErrors; // Field-specific errors
  data?: TData;
};

interface CourseChaptersProps {
  readonly chapters: ChapterClientState[];
  readonly setChapters: React.Dispatch<
    React.SetStateAction<ChapterClientState[]>
  >;
  readonly currentCourseId: number | null;
}

export function CourseChapters({
  chapters,
  setChapters,
  currentCourseId,
}: CourseChaptersProps) {
  const [editingChapter, setEditingChapter] =
    useState<ChapterClientState | null>(null);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);
  const [chapterServerError, setChapterServerError] = useState<string | null>(
    null,
  );
  const [chapterServerFieldErrors, setChapterServerFieldErrors] =
    useState<FieldErrors<ClientChapterFormData> | null>(null);

  const handleAddNewChapter = () => {
    setEditingChapter({
      id: undefined,
      title: "",
      description: "",
      videoUrl: "",
      order: chapters.length,
      questions: [],
    });
    setShowChapterDialog(true);
  };

  const handleEditChapter = (chapter: ChapterClientState) => {
    setEditingChapter(structuredClone(chapter));
    setShowChapterDialog(true);
  };

  const handleDeleteChapter = async (chapter: ChapterClientState) => {
    if (!chapter.chapterId) {
      toast.error("Chapter ID is missing.");
      return;
    }

    const result = await deleteCourseChapters([chapter.chapterId]);

    if (result.success) {
      toast.success("Chapter deleted.");
      setChapters((prev) => prev.filter((ch) => ch.id !== chapter.id));
    } else {
      toast.error(result.error || "Failed to delete chapter.");
    }
  };

  // Helper: Delete questions that were removed
  const deleteRemovedQuestions = async (
    chapterFormData: any,
    originalChapter?: ChapterClientState,
  ) => {
    // Handle deletion of all questions
    if (!chapterFormData.questions || chapterFormData.questions.length === 0) {
      if (originalChapter?.questions && originalChapter.questions.length > 0) {
        const questionIdsToDelete = originalChapter.questions
          .filter((q) => q.id && !Number.isNaN(Number(q.id)))
          .map((q) => Number(q.id));

        if (questionIdsToDelete.length > 0) {
          const deleteResponse =
            await deleteChapterQuestions(questionIdsToDelete);
          if (!deleteResponse.success) {
            toast.warning(
              "Chapter updated but failed to delete removed questions: " +
                deleteResponse.error,
            );
          }
        }
      }
      return;
    }

    // Find questions that were deleted (in original but not in current form data)
    const currentQuestionIds = new Set(
      chapterFormData.questions
        .filter((q: any) => q.id && !Number.isNaN(Number(q.id)))
        .map((q: any) => q.id),
    );

    const questionIdsToDelete =
      originalChapter?.questions
        ?.filter(
          (q) =>
            q.id &&
            !Number.isNaN(Number(q.id)) &&
            !currentQuestionIds.has(q.id),
        )
        .map((q) => Number(q.id)) || [];

    if (questionIdsToDelete.length > 0) {
      const deleteResponse = await deleteChapterQuestions(questionIdsToDelete);
      if (!deleteResponse.success) {
        toast.warning(
          "Chapter updated but failed to delete removed questions: " +
            deleteResponse.error,
        );
      }
    }
  };

  // Helper: Process question updates and creations
  const processQuestionChanges = async (
    chapterFormData: any,
    response: ActionResponseState<Chapter | Chapter[]>,
  ) => {
    if (!chapterFormData.questions || chapterFormData.questions.length === 0) {
      return;
    }

    // Separate questions into existing (to update) and new (to create)
    const questionsToUpdate = chapterFormData.questions
      .filter((q: any) => q.id && !Number.isNaN(Number(q.id)))
      .map((q: any) => ({
        questionId: Number(q.id),
        text: q.text,
        description: q.description || null,
        feedback: q.feedback || null,
        type: q.type || "multiple_choice",
        options: q.options?.map((opt: any) => ({
          text: opt.text,
          isCorrect: opt.isCorrect ?? false,
        })),
      }));

    const questionsToCreate = chapterFormData.questions
      .filter((q: any) => !q.id || Number.isNaN(Number(q.id)))
      .map((q: any) => ({
        chapterId: chapterFormData.chapterId,
        text: q.text,
        description: q.description,
        feedback: q.feedback,
        type: q.type || "multiple_choice",
        options: q.options?.map((opt: any) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      }));

    // Update existing questions
    if (questionsToUpdate.length > 0) {
      const updateResponse = await updateQuestionsAction(questionsToUpdate);
      if (!updateResponse.success) {
        toast.warning(
          "Chapter updated but failed to update questions: " +
            updateResponse.error,
        );
        return;
      }
    }

    // Create new questions
    if (questionsToCreate.length > 0) {
      const createResponse =
        await createChapterQuestionsAction(questionsToCreate);
      if (!createResponse.success) {
        toast.warning(
          "Chapter updated but failed to create new questions: " +
            createResponse.error,
        );
        return;
      }

      // Merge newly created questions with response data
      if (createResponse.data && response.data) {
        const chapterData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        chapterData.questions = [
          ...(chapterData.questions || []),
          ...createResponse.data,
        ];
      }
    }
  };

  // Helper: Handle questions for updated chapters
  const handleQuestionsForUpdatedChapter = async (
    chapterFormData: any,
    response: ActionResponseState<Chapter | Chapter[]>,
    originalChapter?: ChapterClientState,
  ) => {
    await deleteRemovedQuestions(chapterFormData, originalChapter);
    await processQuestionChanges(chapterFormData, response);
  };

  // Helper: Update existing chapter
  const updateExistingChapter = async (
    chapterFormData: any,
  ): Promise<ActionResponseState<Chapter | Chapter[]>> => {
    // Find the original chapter from the chapters list
    const originalChapter = chapters.find(
      (ch) => ch.chapterId === chapterFormData.chapterId,
    );

    const response = await updateChapterAction({
      chapterId: chapterFormData.chapterId,
      title: chapterFormData.title,
      description: chapterFormData.description,
      videoUrl: chapterFormData.videoUrl,
      order: chapterFormData.order,
    });

    if (response.success) {
      await handleQuestionsForUpdatedChapter(
        chapterFormData,
        response,
        originalChapter,
      );
    }

    return response;
  };

  // Helper: Create new chapter
  const createNewChapter = async (
    chapterFormData: any,
  ): Promise<ActionResponseState<Chapter | Chapter[]>> => {
    return await createChaptersAction([
      {
        courseId: currentCourseId!,
        title: chapterFormData.title,
        description: chapterFormData.description,
        videoUrl: chapterFormData.videoUrl,
        order: chapterFormData.order,
        questions: chapterFormData.questions,
      },
    ]);
  };

  // Helper: Update chapters state with saved data
  const updateChaptersState = (savedChapterData: Chapter, formData?: any) => {
    setChapters((prevChapters) => {
      const chapterId = savedChapterData.chapterId;
      const existingChapterIndex = prevChapters.findIndex(
        (ch) => ch.chapterId === chapterId,
      );

      let updatedChapters: ChapterClientState[];

      if (existingChapterIndex > -1) {
        updatedChapters = [...prevChapters];
        const chapterToUpdate = updatedChapters[existingChapterIndex];

        updatedChapters[existingChapterIndex] = {
          ...chapterToUpdate,
          ...savedChapterData,
          description: savedChapterData.description ?? undefined,
          // Include questions from form data if available (for updates)
          // or from saved data (for new chapters with questions)
          questions:
            formData?.questions ||
            savedChapterData.questions ||
            chapterToUpdate.questions,
        } as ChapterClientState;
      } else {
        updatedChapters = [
          ...prevChapters,
          {
            ...savedChapterData,
            description: savedChapterData.description ?? undefined,
            questions: savedChapterData.questions || [],
          } as ChapterClientState,
        ];
      }

      // Sort chapters by order
      return updatedChapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  };

  // Helper: Handle successful save response
  const handleSuccessResponse = (
    response: ActionResponseState<Chapter | Chapter[]>,
    formData?: any,
  ) => {
    const savedChapterData = Array.isArray(response.data)
      ? response.data[0]
      : response.data!;

    toast.success(response.message || "Chapter saved!");
    updateChaptersState(savedChapterData, formData);
    setShowChapterDialog(false);
    setEditingChapter(null);
  };

  // Helper: Handle error response
  const handleErrorResponse = (
    response: ActionResponseState<Chapter | Chapter[]>,
  ) => {
    toast.error(response.error || "Failed to save chapter.");

    if (response.errors) {
      setChapterServerFieldErrors(
        response.errors as FieldErrors<ClientChapterFormData>,
      );
    } else {
      setChapterServerError(response.error || "An unknown error occurred.");
    }
  };

  const handleSaveChapter = async (chapterFormData: any) => {
    if (!currentCourseId) {
      toast.error("Course ID is missing. Cannot save chapter.");
      return;
    }

    setIsSubmittingChapter(true);
    setChapterServerError(null);
    setChapterServerFieldErrors(null);

    try {
      const response = chapterFormData.chapterId
        ? await updateExistingChapter(chapterFormData)
        : await createNewChapter(chapterFormData);

      if (response.success && response.data) {
        handleSuccessResponse(response, chapterFormData);
      } else if (response.success && !response.data) {
        toast.warning(
          "Action successful, but couldn't get updated data from server. Please refresh.",
        );
      } else {
        handleErrorResponse(response);
      }
    } finally {
      setIsSubmittingChapter(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manage Chapters</CardTitle>
              <CardDescription>
                Organize your course content into chapters.
              </CardDescription>
            </div>
            <Button
              onClick={handleAddNewChapter}
              variant="outline"
              disabled={!currentCourseId}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Chapter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chapters.length === 0 && (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
              <ListVideo className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="font-semibold">No chapters yet.</p>
              <p className="text-sm">
                Get started by adding your first chapter.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <Card
                key={chapter.chapterId}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/30">
                  <div className="flex-1 min-w-0 mr-4">
                    <CardTitle className="text-lg truncate">
                      {chapter?.title || `Chapter ${index + 1}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Order {chapter.order}
                    </p>
                    {chapter.questions && chapter.questions.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {chapter.questions.length} question
                        {chapter.questions.length === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditChapter(chapter)}
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChapter(chapter)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showChapterDialog}
        onOpenChange={(open) => {
          if (!open) setEditingChapter(null);
          setShowChapterDialog(open);
        }}
      >
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">
              {editingChapter?.id && !editingChapter.tempId
                ? "Edit Chapter"
                : "Add New Chapter"}
            </DialogTitle>
            <DialogDescription>
              {editingChapter?.id && !editingChapter.tempId
                ? "Make changes to this chapter."
                : "Create a new chapter for your course."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            {editingChapter && currentCourseId && (
              <ChapterForm
                key={editingChapter.id || editingChapter.tempId}
                chapterInitialData={editingChapter}
                onSave={handleSaveChapter}
                isSubmitting={isSubmittingChapter}
                serverError={chapterServerError}
                serverFieldErrors={chapterServerFieldErrors}
                onCancel={() => {
                  setShowChapterDialog(false);
                  setEditingChapter(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
