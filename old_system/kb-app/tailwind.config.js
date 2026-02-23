/** @type {import('tailwindcss').Config} */
import nativewindPreset from "nativewind/preset";
import {
  colors,
  fontFamily,
  borderRadius,
  boxShadow,
  spacing,
  animation,
  transitionDuration,
  keyframes,
} from "./theme/tokens";

export const content = [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./components/**/*.{js,jsx,ts,tsx}",
];
export const presets = [nativewindPreset];
export const theme = {
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  extend: {
    colors,
    fontFamily,
    borderRadius,
    boxShadow,
    spacing,
    animation,
    transitionDuration,
    keyframes,
    // Map font weights to Rajdhani font families
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  // Override default font family to always use Rajdhani
  fontFamily: {
    sans: ["Rajdhani-Regular"],
  },
};
export const plugins = [];
