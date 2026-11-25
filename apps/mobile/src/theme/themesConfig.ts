import type { AppIconName } from "../components/AppIcon";

export interface ThemeVisual {
  id: string;
  label: string;
  tint: string;
  icon: AppIconName;
}

const THEME_VISUALS: Record<string, ThemeVisual> = {
  "cinema-arte": { id: "cinema-arte", label: "Cinema & Arte", tint: "#C87D55", icon: "film" },
  "escola-estudo": { id: "escola-estudo", label: "Escola & Estudo", tint: "#8E7CC3", icon: "graduation" },
  "ferias-praia": { id: "ferias-praia", label: "Férias & Praia", tint: "#4B9CD3", icon: "sun" },
  "trabalho-negocios": { id: "trabalho-negocios", label: "Trabalho & Negócios", tint: "#5F9EA0", icon: "briefcase" },
  "tecnologia-digital": { id: "tecnologia-digital", label: "Tecnologia & Digital", tint: "#6A8CAF", icon: "cpu" },
  "saude-bem-estar": { id: "saude-bem-estar", label: "Saúde & Bem-estar", tint: "#67B897", icon: "heart" },
  "gastronomia-casa": { id: "gastronomia-casa", label: "Gastronomia & Casa", tint: "#D9A441", icon: "coffee" },
  geral: { id: "geral", label: "Uso Geral", tint: "#67B897", icon: "book" },
};

export function getThemeVisual(themeId?: string): ThemeVisual {
  if (themeId && THEME_VISUALS[themeId]) {
    return THEME_VISUALS[themeId];
  }
  return THEME_VISUALS.geral!;
}
