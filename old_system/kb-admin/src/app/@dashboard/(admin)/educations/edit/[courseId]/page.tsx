import { CourseForm } from "@/components/educations/course-form";
import { getCourseByIdAction } from "@/actions/courses-actions";
import type { ChapterClientState } from "@/components/educations/course-chapters";
import type { Chapter } from "@/db/queries/course-queries";

interface EditCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const transformChapters = (chapters?: Chapter[]): ChapterClientState[] => {
  if (!chapters) return [];

  return chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    id: chapter.chapterId?.toString(),
    title: chapter.title,
    description: chapter.description || undefined,
    videoUrl: chapter.videoUrl || undefined,
    questions: chapter.questions?.map((q) => ({
      id: q.questionId?.toString(),
      text: q.text,
      description: q.description || undefined,
      feedback: q.feedback || undefined,
      options:
        q.options?.map((o) => ({
          id: o.optionId?.toString(),
          text: o.text,
          isCorrect: o.isCorrect ?? false,
        })) || [],
    })),
  }));
};

const EditCoursePage = async ({ params }: EditCoursePageProps) => {
  const { courseId } = await params;
  const { data, error } = await getCourseByIdAction(courseId);

  if (error || !data) {
    return (
      <div className="h-full bg-muted rounded-lg p-10 gap-6 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Failed to Load Course
          </h2>
          <p className="text-muted-foreground">{error || "Course not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-muted rounded-lg p-10 gap-6 flex flex-col">
      <CourseForm
        initialData={{
          courseId: data.courseId!,
          title: data.title,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
          status: data.status,
          certificateEnabled: data.certificateEnabled,
          chapters: transformChapters(data.chapters),
        }}
      />
    </div>
  );
};

export default EditCoursePage;
