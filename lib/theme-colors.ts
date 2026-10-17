export const THEME_COLORS = [
  { key: "violet", label: "Violet", swatch: "oklch(0.52 0.24 285)", companion: "oklch(0.68 0.22 350)" },
  { key: "blue", label: "Ocean", swatch: "oklch(0.55 0.21 260)", companion: "oklch(0.72 0.14 220)" },
  { key: "teal", label: "Teal", swatch: "oklch(0.58 0.12 190)", companion: "oklch(0.75 0.13 160)" },
  { key: "emerald", label: "Emerald", swatch: "oklch(0.58 0.15 155)", companion: "oklch(0.78 0.16 130)" },
  { key: "rose", label: "Rose", swatch: "oklch(0.6 0.22 15)", companion: "oklch(0.72 0.17 50)" },
  { key: "orange", label: "Sunset", swatch: "oklch(0.64 0.19 45)", companion: "oklch(0.8 0.16 80)" },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["key"];

export const DEFAULT_THEME_COLOR: ThemeColor = "violet";
export const THEME_COLOR_COOKIE = "theme_color";

export function isThemeColor(value: unknown): value is ThemeColor {
  return THEME_COLORS.some((c) => c.key === value);
}

/**
 * Runs in <head> before first paint: applies the saved color so pages never
 * flash the default theme. Kept tiny and self-contained (no imports).
 */
export const THEME_COLOR_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COLOR_COOKIE}=([a-z]+)/);var v=m&&m[1];if(v&&${JSON.stringify(
  THEME_COLORS.map((c) => c.key)
)}.indexOf(v)>-1&&v!=="${DEFAULT_THEME_COLOR}")document.documentElement.setAttribute("data-theme-color",v);}catch(e){}})();`;

/** Apply a theme color immediately, with a brief color cross-fade, and remember it. */
export function applyThemeColor(color: ThemeColor) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  if (color === DEFAULT_THEME_COLOR) root.removeAttribute("data-theme-color");
  else root.setAttribute("data-theme-color", color);
  document.cookie = `${THEME_COLOR_COOKIE}=${color}; path=/; max-age=31536000; samesite=lax`;
  window.setTimeout(() => root.classList.remove("theme-transition"), 400);
}

export function readThemeColor(): ThemeColor {
  const value = document.documentElement.getAttribute("data-theme-color");
  return isThemeColor(value) ? value : DEFAULT_THEME_COLOR;
}
