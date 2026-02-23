import { getAllCourses } from "@/db/queries/course-queries";

export async function GET() {
  try {
    const { success, data, error } = await getAllCourses();

    if (!success || !data) {
      return Response.json(
        { error: error || "Failed to fetch courses" },
        { status: 500 },
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error in course-catalog API:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
