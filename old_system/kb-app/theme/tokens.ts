/**
 * Design System Tokens
 *
 * Centralized design tokens for colors, spacing, typography, etc.
 * These tokens are used to extend the Tailwind theme configuration.
 *
 * Note: HSL values converted to hex for React Native compatibility.
 * All colors MUST be in hex format for React Native.
 */

/**
 * Color Tokens
 * Organized by semantic meaning and theme (light/dark)
 * Based on the design system CSS variables
 */
export const colors = {
  // Base colors
  background: "#344556", // hsl(210 18% 24%)
  foreground: "#FAFAFA", // hsl(0 0% 98%)

  // Card colors
  card: {
    DEFAULT: "#1F2429", // hsl(220 16% 16%)
    foreground: "#FAFAFA", // hsl(0 0% 98%)
    hover: "#252B31", // hsl(220 16% 18%)
  },

  // Popover colors
  popover: {
    DEFAULT: "#1F2429", // hsl(220 16% 16%)
    foreground: "#FAFAFA", // hsl(0 0% 98%)
  },

  // Primary colors
  primary: {
    DEFAULT: "#5593AC", // hsl(200 25% 45%)
    foreground: "#FAFAFA", // hsl(0 0% 98%)
  },

  // Secondary colors
  secondary: {
    DEFAULT: "#9EC9D4", // hsl(180 25% 70%)
    foreground: "#1A2025", // hsl(220 18% 12%)
  },

  // Muted colors
  muted: {
    DEFAULT: "#252B31", // hsl(220 16% 18%)
    foreground: "#8899A6", // hsl(220 9% 60%)
  },

  // Accent colors
  accent: {
    DEFAULT: "#00D9FF", // hsl(180 80% 50%)
    foreground: "#1A2025", // hsl(220 18% 12%)
  },

  // Destructive colors
  destructive: {
    DEFAULT: "#E85D5D", // hsl(0 84.2% 60.2%)
    foreground: "#FAFAFA", // hsl(0 0% 98%)
  },

  // Border and input colors
  border: "#2E3640", // hsl(220 16% 22%)
  input: "#2E3640", // hsl(220 16% 22%)
  ring: "#00D9FF", // hsl(180 80% 50%)

  // Custom application tokens
  "app-header": "#344556", // hsl(210 18% 24%)
  "app-header-foreground": "#FAFAFA", // hsl(0 0% 98%)

  "page-bg": "#1e242b",
  "page-foreground": "#22272f",

  "nav-bg": "#344556", // hsl(210 18% 24%)
  "nav-foreground": "#8899A6", // hsl(220 9% 60%)
  "nav-active": "#00D9FF", // hsl(180 80% 50%)

  "warning-bg": "#252B31", // hsl(220 16% 18%)
  "warning-foreground": "#00D9FF", // hsl(180 80% 50%)
  "warning-border": "#343D47", // hsl(220 16% 25%)

  success: "#00D9FF", // hsl(180 80% 50%)
  "card-hover": "#252B31", // hsl(220 16% 18%)
  olive: "#7F9F5E", // hsl(75 40% 45%)

  // Sidebar colors
  sidebar: {
    DEFAULT: "#1F2429", // hsl(220 16% 16%) - background
    foreground: "#FAFAFA", // hsl(0 0% 98%)
    primary: "#00D9FF", // hsl(180 80% 50%)
    "primary-foreground": "#1A2025", // hsl(220 18% 12%)
    accent: "#2E3640", // hsl(220 16% 22%)
    "accent-foreground": "#FAFAFA", // hsl(0 0% 98%)
    border: "#2E3640", // hsl(220 16% 22%)
    ring: "#00D9FF", // hsl(180 80% 50%)
  },
};

/**
 * Dark mode color overrides
 * These values differ from the default theme
 */
export const darkColors = {
  card: {
    DEFAULT: "#181C20", // hsl(220 16% 12%)
    hover: "#1F2328", // hsl(220 16% 14%)
  },

  popover: {
    DEFAULT: "#181C20", // hsl(220 16% 12%)
  },

  muted: {
    DEFAULT: "#1F2328", // hsl(220 16% 14%)
  },

  accent: {
    foreground: "#0E1215", // hsl(220 18% 8%)
  },

  border: "#252B31", // hsl(220 16% 18%)
  input: "#252B31", // hsl(220 16% 18%)

  warning: {
    bg: "#1F2328", // hsl(220 16% 14%)
    border: "#2B323A", // hsl(220 16% 20%)
  },

  sidebar: {
    background: "#181C20", // hsl(220 16% 12%)
    "primary-foreground": "#0E1215", // hsl(220 18% 8%)
    accent: "#252B31", // hsl(220 16% 18%)
    border: "#252B31", // hsl(220 16% 18%)
  },
};

/**
 * Border Radius Tokens
 * Based on CSS variable --radius: 0.5rem
 */
export const borderRadius = {
  lg: "0.5rem", // var(--radius)
  md: "calc(0.5rem - 2px)", // calc(var(--radius) - 2px)
  sm: "calc(0.5rem - 4px)", // calc(var(--radius) - 4px)
  DEFAULT: "0.5rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
};

/**
 * Box Shadow Tokens
 */
export const boxShadow = {
  subtle: "0 2px 8px rgba(0, 0, 0, 0.15)",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "none",
};

/**
 * Spacing Tokens
 */
export const spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

/**
 * Font Family Tokens
 * Updated to use Rajdhani as primary font (matching web design system)
 *
 * Note: In React Native, font weights are mapped to specific font families via CSS utilities.
 * Use standard Tailwind classes: font-light, font-normal, font-medium, font-semibold, font-bold
 * These automatically map to the correct Rajdhani font variant.
 */
export const fontFamily = {
  sans: ["Rajdhani-Regular", "sans-serif"],
  rajdhani: ["Rajdhani-Regular", "sans-serif"],
};

/**
 * Keyframes for animations
 */
export const keyframes = {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
};

/**
 * Animation Tokens
 */
export const animation = {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  none: "none",
  spin: "spin 1s linear infinite",
  ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
  pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  bounce: "bounce 1s infinite",
};

/**
 * Transition Tokens
 */
export const transitionDuration = {
  75: "75ms",
  100: "100ms",
  150: "150ms",
  200: "200ms",
  300: "300ms",
  500: "500ms",
  700: "700ms",
  1000: "1000ms",
};
