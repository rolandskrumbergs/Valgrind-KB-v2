import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

async function testPDF() {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Try loading the custom font
    const fontPath = path.join(
      process.cwd(),
      "src/assets/fonts/Roboto-Regular.ttf",
    );
    console.log("Font path:", fontPath);
    console.log("Font exists:", fs.existsSync(fontPath));

    const fontBytes = fs.readFileSync(fontPath);
    console.log("Font bytes length:", fontBytes.length);

    const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });
    console.log("Font embedded successfully");

    const page = pdfDoc.addPage([595, 842]);
    page.drawText("Hello World", {
      x: 50,
      y: 700,
      size: 30,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    console.log("PDF bytes length:", pdfBytes.length);

    // Write to file for testing
    fs.writeFileSync("test-certificate.pdf", pdfBytes);
    console.log("PDF saved to test-certificate.pdf");
  } catch (error) {
    console.error("Error:", error);
  }
}

testPDF();
