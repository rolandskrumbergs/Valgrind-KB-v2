import type { PDFFont, RGB } from "pdf-lib";

export type CertificateData = {
  courseId: string;
  courseTitle: string;
  userName: string;
  userLastName: string;
  completedOn: Date;
  certificateId: string;
};

export type CertificateFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

export type CertificateColors = {
  darkBg: RGB;
  white: RGB;
  lightGray: RGB;
  cyan: RGB;
  gold: RGB;
  mediumGray: RGB;
  darkGray: RGB;
};
