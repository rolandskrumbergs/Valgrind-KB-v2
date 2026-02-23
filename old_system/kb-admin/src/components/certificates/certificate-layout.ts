import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type {
  CertificateData,
  CertificateFonts,
  CertificateColors,
} from "./types";
import { getCenteredX, PAGE_WIDTH, PAGE_HEIGHT, MARGIN } from "./layout-utils";

export function drawCertificateContent(
  page: PDFPage,
  certData: CertificateData,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  // Draw dark background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: colors.darkBg,
  });

  drawContentBorder(page);
  drawLogo(page, fonts, colors);
  drawHeader(page, fonts, colors);
  drawSubtitle(page, fonts, colors);
  drawUserName(page, certData, fonts, colors);
  drawCompletionText(page, fonts, colors);
  drawCourseTitle(page, certData, fonts, colors);
  drawCompletionDate(page, certData, fonts, colors);
  drawFooter(page, fonts, colors);
  drawCertificateId(page, certData, fonts, colors);
}

function drawContentBorder(page: PDFPage): void {
  const borderColor = rgb(0.176, 0.204, 0.259); // #2d3442
  const borderMargin = 30;
  const borderWidth = PAGE_WIDTH - 2 * borderMargin;
  const borderHeight = PAGE_HEIGHT - 2 * borderMargin;
  const borderRadius = 12;
  const borderThickness = 1;

  // Draw straight border lines
  page.drawLine({
    start: { x: borderMargin + borderRadius, y: borderMargin },
    end: { x: borderMargin + borderWidth - borderRadius, y: borderMargin },
    thickness: borderThickness,
    color: borderColor,
  });
  page.drawLine({
    start: { x: borderMargin + borderRadius, y: borderMargin + borderHeight },
    end: {
      x: borderMargin + borderWidth - borderRadius,
      y: borderMargin + borderHeight,
    },
    thickness: borderThickness,
    color: borderColor,
  });
  page.drawLine({
    start: { x: borderMargin, y: borderMargin + borderRadius },
    end: { x: borderMargin, y: borderMargin + borderHeight - borderRadius },
    thickness: borderThickness,
    color: borderColor,
  });
  page.drawLine({
    start: { x: borderMargin + borderWidth, y: borderMargin + borderRadius },
    end: {
      x: borderMargin + borderWidth,
      y: borderMargin + borderHeight - borderRadius,
    },
    thickness: borderThickness,
    color: borderColor,
  });

  // Draw rounded corners
  const arcSteps = 25;

  // Bottom-left corner
  for (let i = 0; i <= arcSteps; i++) {
    const angle = Math.PI + (Math.PI / 2) * (i / arcSteps);
    const x = borderMargin + borderRadius + Math.cos(angle) * borderRadius;
    const y = borderMargin + borderRadius + Math.sin(angle) * borderRadius;
    page.drawCircle({ x, y, size: 0.5, color: borderColor });
  }

  // Bottom-right corner
  for (let i = 0; i <= arcSteps; i++) {
    const angle = -Math.PI / 2 + (Math.PI / 2) * (i / arcSteps);
    const x =
      borderMargin +
      borderWidth -
      borderRadius +
      Math.cos(angle) * borderRadius;
    const y = borderMargin + borderRadius + Math.sin(angle) * borderRadius;
    page.drawCircle({ x, y, size: 0.5, color: borderColor });
  }

  // Top-left corner
  for (let i = 0; i <= arcSteps; i++) {
    const angle = Math.PI / 2 + (Math.PI / 2) * (i / arcSteps);
    const x = borderMargin + borderRadius + Math.cos(angle) * borderRadius;
    const y =
      borderMargin +
      borderHeight -
      borderRadius +
      Math.sin(angle) * borderRadius;
    page.drawCircle({ x, y, size: 0.5, color: borderColor });
  }

  // Top-right corner
  for (let i = 0; i <= arcSteps; i++) {
    const angle = 0 + (Math.PI / 2) * (i / arcSteps);
    const x =
      borderMargin +
      borderWidth -
      borderRadius +
      Math.cos(angle) * borderRadius;
    const y =
      borderMargin +
      borderHeight -
      borderRadius +
      Math.sin(angle) * borderRadius;
    page.drawCircle({ x, y, size: 0.5, color: borderColor });
  }
}

function drawLogo(
  page: PDFPage,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  page.drawText("intresse", {
    x: MARGIN + 20,
    y: PAGE_HEIGHT - MARGIN - 50,
    size: 28,
    font: fonts.bold,
    color: colors.white,
  });
  page.drawText("bevakaren", {
    x: MARGIN + 20,
    y: PAGE_HEIGHT - MARGIN - 80,
    size: 28,
    font: fonts.bold,
    color: colors.white,
  });
}

function drawHeader(
  page: PDFPage,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const headerText = "CERTIFIKAT";
  const headerX = getCenteredX(headerText, 36, fonts.bold);
  const headerY = PAGE_HEIGHT - 220;

  page.drawText(headerText, {
    x: headerX,
    y: headerY,
    size: 36,
    font: fonts.bold,
    color: colors.white,
  });

  // Underline for header
  const textWidth = fonts.bold.widthOfTextAtSize(headerText, 36);
  const underlineWidth = textWidth * 0.7; // 70% of text width
  const underlineX = headerX + (textWidth - underlineWidth) / 2; // Center the shorter line
  page.drawRectangle({
    x: underlineX,
    y: headerY - 18,
    width: underlineWidth,
    height: 4,
    color: rgb(0.341, 0.478, 0.6), // #577a99
  });
}

function drawSubtitle(
  page: PDFPage,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const subtitleText = "Detta intygar att";
  page.drawText(subtitleText, {
    x: getCenteredX(subtitleText, 14, fonts.regular),
    y: PAGE_HEIGHT - 300,
    size: 14,
    font: fonts.regular,
    color: rgb(0.576, 0.604, 0.655), // #939aa7
  });
}

function drawUserName(
  page: PDFPage,
  certData: CertificateData,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const userName = `${certData.userName} ${certData.userLastName}`;
  page.drawText(userName, {
    x: getCenteredX(userName, 20, fonts.bold),
    y: PAGE_HEIGHT - 340,
    size: 20,
    font: fonts.bold,
    color: colors.white,
  });
}

function drawCompletionText(
  page: PDFPage,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const completionText = "har framgångsrikt genomfört utbildningen";
  page.drawText(completionText, {
    x: getCenteredX(completionText, 14, fonts.regular),
    y: PAGE_HEIGHT - 380,
    size: 14,
    font: fonts.regular,
    color: rgb(0.576, 0.604, 0.655), // #939aa7
  });
}

function drawCourseTitle(
  page: PDFPage,
  certData: CertificateData,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const courseTitle = certData.courseTitle;

  // Draw course title (centered)
  page.drawText(courseTitle, {
    x: getCenteredX(courseTitle, 18, fonts.bold),
    y: PAGE_HEIGHT - 470,
    size: 18,
    font: fonts.bold,
    color: colors.white,
  });
}

function drawCompletionDate(
  page: PDFPage,
  certData: CertificateData,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const completionDate = new Date(certData.completedOn).toLocaleDateString(
    "sv-SE",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  page.drawText(completionDate, {
    x: getCenteredX(completionDate, 14, fonts.regular),
    y: PAGE_HEIGHT - 540,
    size: 14,
    font: fonts.regular,
    color: colors.lightGray,
  });
}

function drawFooter(
  page: PDFPage,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const issuerText = "Utfärdare: Intressebevakaren AB";
  page.drawText(issuerText, {
    x: getCenteredX(issuerText, 12, fonts.regular),
    y: 100,
    size: 12,
    font: fonts.regular,
    color: colors.lightGray,
  });
}

function drawCertificateId(
  page: PDFPage,
  certData: CertificateData,
  fonts: CertificateFonts,
  colors: CertificateColors,
): void {
  const certIdText = `Certifikat ID: ${certData.certificateId}`;
  const certIdWidth = fonts.regular.widthOfTextAtSize(certIdText, 10);
  page.drawText(certIdText, {
    x: PAGE_WIDTH - MARGIN - certIdWidth,
    y: 60,
    size: 10,
    font: fonts.regular,
    color: colors.mediumGray,
  });
}
