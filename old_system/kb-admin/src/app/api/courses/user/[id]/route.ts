import { getUserCourseById } from "@/db/queries/course-queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const response = await getUserCourseById({ courseId: id, userId });

  return Response.json(response);
}
