import {
  getCoursesByUserId,
  UserCourseStatus,
} from "@/db/queries/course-queries";

export async function GET(request: Request) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as UserCourseStatus;

  const courses = await getCoursesByUserId(userId, status);

  return Response.json(courses);
}
