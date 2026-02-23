import { rgb } from "pdf-lib";
import type { CertificateColors } from "./types";

export function getCertificateColors(): CertificateColors {
  return {
    darkBg: rgb(0.27, 0.29, 0.33),
    white: rgb(1, 1, 1),
    lightGray: rgb(0.85, 0.85, 0.85),
    cyan: rgb(0.5, 0.8, 0.9),
    gold: rgb(1, 0.84, 0),
    mediumGray: rgb(0.6, 0.6, 0.6),
    darkGray: rgb(0.4, 0.4, 0.4),
  };
}
