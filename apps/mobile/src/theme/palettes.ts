export type ThemeMode = "day" | "night";

export interface VocabPalette {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  gold: string;
  success: string;
  danger: string;
}

export const PALETTES: Record<ThemeMode, VocabPalette> = {
  day: {
    mode: "day",
    bg: "#f6f3ec",
    surface: "#ffffff",
    surfaceAlt: "#ede8dd",
    border: "#dfd8ca",
    text: "#1c1b18",
    muted: "#656056",
    accent: "#246a52",
    accentSoft: "rgba(36, 106, 82, 0.12)",
    accentInk: "#ffffff",
    gold: "#d69e4e",
    success: "#246a52",
    danger: "#c95b4b",
  },
  night: {
    mode: "night",
    bg: "#13161c",
    surface: "#1b1f28",
    surfaceAlt: "#232834",
    border: "#2f3545",
    text: "#efede8",
    muted: "#9ea5b3",
    accent: "#67b897",
    accentSoft: "rgba(103, 184, 151, 0.14)",
    accentInk: "#0e1914",
    gold: "#e8b86d",
    success: "#67b897",
    danger: "#ff8c7a",
  },
};
