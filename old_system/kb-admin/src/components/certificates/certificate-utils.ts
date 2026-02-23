import crypto from "node:crypto";
import type { CertificateData } from "./types";
import { updateUserCourseCertificateId } from "@/db/queries/course-queries";

/**
 * Generate certificate ID and persist to database if needed
 */
export async function ensureCertificateId(
  userId: string,
  courseId: number,
  existingCertificateId?: string | null,
): Promise<string> {
  if (existingCertificateId) {
    return existingCertificateId;
  }

  const certificateId = crypto.randomUUID().slice(0, 9);
  await updateUserCourseCertificateId(userId, courseId, certificateId);
  return certificateId;
}

/**
 * Transform course data to certificate data format
 */
export async function prepareCertificateData(
  userId: string,
  courses: Array<{
    courseId: number;
    title: string;
    completedOn: Date;
    certificateId?: string | null;
  }>,
  userName: string,
  userLastName: string,
): Promise<CertificateData[]> {
  const certificatesData: CertificateData[] = [];

  for (const course of courses) {
    const certificateId = await ensureCertificateId(
      userId,
      course.courseId,
      course.certificateId,
    );

    certificatesData.push({
      courseId: String(course.courseId),
      courseTitle: course.title,
      userName,
      userLastName,
      completedOn: new Date(course.completedOn),
      certificateId,
    });
  }

  return certificatesData;
}

/**
 * Generate sanitized filename for certificate PDF
 */
export function generateCertificateFilename(userName: string): string {
  const sanitizedUserName = userName
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "-");
  const date = new Date().toISOString().split("T")[0];
  return `certificates-${sanitizedUserName}-${date}.pdf`;
}
