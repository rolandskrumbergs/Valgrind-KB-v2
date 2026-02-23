import { verifyCertificateById } from "@/db/queries/course-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } },
) {
  try {
    const { certificateId } = params;

    if (!certificateId) {
      return NextResponse.json(
        { valid: false, error: "Certificate ID is required" },
        { status: 400 },
      );
    }

    const certificate = await verifyCertificateById(certificateId);

    if (!certificate) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      userName: certificate.userName,
      courseTitle: certificate.courseTitle,
      completedOn: certificate.completedOn,
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
