import { updateUserCourseStatus } from "@/db/queries/course-queries";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const data = await request.json();
  const { id } = await params;

  const response = await updateUserCourseStatus({
    courseId: Number(id),
    userId,
    status: data.status,
  });

  return Response.json(response);
}
