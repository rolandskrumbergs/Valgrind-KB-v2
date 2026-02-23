import type { PDFFont } from "pdf-lib";

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;
export const MARGIN = 40;

/**
 * Calculate the X coordinate to center text horizontally on the page
 */
export function getCenteredX(
  text: string,
  size: number,
  font: PDFFont,
  pageWidth: number = PAGE_WIDTH,
): number {
  const textWidth = font.widthOfTextAtSize(text, size);
  return (pageWidth - textWidth) / 2;
}
