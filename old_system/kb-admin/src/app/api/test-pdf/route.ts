import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Try loading the custom font
    const fontPath = path.join(
      process.cwd(),
      "src/assets/fonts/Roboto-Regular.ttf",
    );
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    const page = pdfDoc.addPage([595, 842]);
    page.drawText("Hello World - Test Certificate", {
      x: 50,
      y: 700,
      size: 30,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer properly
    const buffer = Buffer.from(
      pdfBytes.buffer,
      pdfBytes.byteOffset,
      pdfBytes.byteLength,
    );

    // Return as a proper response with correct headers
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="test.pdf"',
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
