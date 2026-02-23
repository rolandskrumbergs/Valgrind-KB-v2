import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { CertificateData } from "./types";
import { loadCertificateFonts } from "./font-loader";
import { getCertificateColors } from "./colors";
import { drawCertificateContent } from "./certificate-layout";

export async function generateCertificatePDF(
  certificatesData: CertificateData[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Register fontkit for custom font support (required for TTF fonts)
  pdfDoc.registerFontkit(fontkit);

  // Set PDF metadata for better compatibility
  pdfDoc.setProducer("IB Admin Certificate Generator");
  pdfDoc.setCreator("IB Admin");

  // Load fonts with fallback
  const fonts = await loadCertificateFonts(pdfDoc);
  const colors = getCertificateColors();

  // Generate certificate for each completed course
  for (const certData of certificatesData) {
    const page = pdfDoc.addPage([595, 842]); // A4 dimensions
    drawCertificateContent(page, certData, fonts, colors);
  }

  // Save with options for better browser compatibility
  return await pdfDoc.save({
    useObjectStreams: false,
  });
}
