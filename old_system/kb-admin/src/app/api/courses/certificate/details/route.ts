import {
  getUserCompletedCoursesDetails,
  COURSE_PASSING_THRESHOLD,
} from "@/db/queries/course-queries";

export async function GET(request: Request) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const completedCoursesDetails = await getUserCompletedCoursesDetails(userId);

  if (!completedCoursesDetails.success) {
    return Response.json(completedCoursesDetails);
  }

  // Filter out courses that don't have certificates enabled
  // Include all completed courses but mark which ones are eligible for certificates
  const coursesWithCertificateInfo = completedCoursesDetails.data?.map(
    (course) => ({
      ...course,
      eligibleForCertificate: course.certificateEnabled && course.passed,
      requiredScore: COURSE_PASSING_THRESHOLD,
    }),
  );

  return Response.json({ success: true, data: coursesWithCertificateInfo });
}
