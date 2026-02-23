import {
  getUserCompletedCoursesDetails,
  COURSE_PASSING_THRESHOLD,
} from "@/db/queries/course-queries";
import { getUserById } from "@/db/queries/user-queries";
import {
  generateCertificatePDF,
  prepareCertificateData,
  generateCertificateFilename,
} from "@/components/certificates";

export async function GET(request: Request) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  // Extract courseId from query string if provided
  const url = new URL(request.url);
  const courseIdParam = url.searchParams.get("courseId");

  const completedCoursesDetails = await getUserCompletedCoursesDetails(userId);

  console.log(completedCoursesDetails);

  if (!completedCoursesDetails.data?.length || completedCoursesDetails.error) {
    return Response.json(
      completedCoursesDetails.error ??
        "The user has not completed any courses yet",
    );
  }

  // TODO: Re-enable these filters when client properly handles certificate eligibility
  // Currently returning PDF for all completed courses regardless of pass/certificate status
  // Filter out courses that don't have certificates enabled or where user didn't pass
  // const certificateEnabledCourses = completedCoursesDetails.data.filter(
  //   (course) => course.certificateEnabled && course.passed,
  // );
  // if (certificateEnabledCourses.length === 0) {
  //   return Response.json(
  //     `No completed courses with certificate enabled and passing score (≥${COURSE_PASSING_THRESHOLD}%)`,
  //     {
  //       status: 404,
  //     },
  //   );
  // }

  // Temporary: use all completed courses for PDF generation
  const certificateEnabledCourses = completedCoursesDetails.data;

  const user = await getUserById(userId, ["name", "lastName"]);

  if (!user.data) {
    return Response.json("User not found", { status: 404 });
  }

  // Filter courses by courseId if provided
  let coursesToGenerate = certificateEnabledCourses;
  if (courseIdParam) {
    const courseId = Number(courseIdParam);
    coursesToGenerate = certificateEnabledCourses.filter(
      (course) => course.courseId === courseId,
    );

    // TODO: Re-enable these checks when client properly handles certificate eligibility
    // if (coursesToGenerate.length === 0) {
    //   const courseExists = completedCoursesDetails.data.find(
    //     (course) => course.courseId === courseId,
    //   );
    //   if (courseExists && !courseExists.certificateEnabled) {
    //     return Response.json("This course does not provide a certificate", {
    //       status: 400,
    //     });
    //   }
    //   if (courseExists && !courseExists.passed) {
    //     return Response.json(
    //       {
    //         message: `You need to score at least ${COURSE_PASSING_THRESHOLD}% to receive a certificate`,
    //         score: courseExists.score,
    //         requiredScore: COURSE_PASSING_THRESHOLD,
    //         passed: false,
    //       },
    //       { status: 400 },
    //     );
    //   }
    //   return Response.json(
    //     `Course with ID ${courseId} not found or not completed yet`,
    //     { status: 404 },
    //   );
    // }
  }

  // Prepare certificate data for completed courses
  const certificatesData = await prepareCertificateData(
    userId,
    coursesToGenerate,
    user.data.name,
    user.data.lastName,
  );

  // Generate PDF with certificates
  const pdfBytes = await generateCertificatePDF(certificatesData);

  // Generate filename
  const filename = generateCertificateFilename(user.data.name);

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBytes.byteLength.toString(),
    },
  });
}
