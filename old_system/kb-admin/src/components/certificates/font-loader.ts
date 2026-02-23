import { type PDFDocument, StandardFonts } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import type { CertificateFonts } from "./types";

export async function loadCertificateFonts(
  pdfDoc: PDFDocument,
): Promise<CertificateFonts> {
  try {
    const fontRegularBytes = fs.readFileSync(
      path.join(process.cwd(), "src/assets/fonts/Roboto-Regular.ttf"),
    );
    const fontBoldBytes = fs.readFileSync(
      path.join(process.cwd(), "src/assets/fonts/Roboto-Bold.ttf"),
    );

    // Use subset: true to ensure proper font embedding for browser compatibility
    const regular = await pdfDoc.embedFont(fontRegularBytes, { subset: true });
    const bold = await pdfDoc.embedFont(fontBoldBytes, { subset: true });

    return { regular, bold };
  } catch (error) {
    console.error("Error loading Roboto fonts, using fallback:", error);

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    return { regular, bold };
  }
}
