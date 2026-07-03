export interface TextStyle {
  font: string;
  size: number;
  color: string;
}
export interface HeadingStyle extends TextStyle {
  bold: boolean;
  before: number;
  after: number;
}
export interface DocumentTheme {
  body: TextStyle & { lineSpacing: number; paragraphAfter: number };
  headings: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "h6", HeadingStyle>;
  code: { font: string; size: number; background: string; border: string };
  quote: { border: string; borderSize: number; indentation: number };
  table: { border: string; headerBackground: string; cellPadding: number };
  links: { color: string };
  math: { border: string };
  horizontalRule: { color: string; size: number };
}
export type ThemeName = "default" | "academic" | "minimal";
const heading = (
  font: string,
  size: number,
  color: string,
  before: number,
  after: number,
): HeadingStyle => ({ font, size, color, bold: true, before, after });
export const themes: Record<ThemeName, DocumentTheme> = {
  default: {
    body: { font: "Calibri", size: 11, color: "222222", lineSpacing: 1.2, paragraphAfter: 6 },
    headings: {
      h1: heading("Calibri", 16, "2E74B5", 16, 8),
      h2: heading("Calibri", 13, "2E74B5", 12, 6),
      h3: heading("Calibri", 12, "1F4D78", 10, 4),
      h4: heading("Calibri", 11, "1F4D78", 8, 4),
      h5: heading("Calibri", 11, "365F91", 8, 4),
      h6: heading("Calibri", 10, "365F91", 8, 4),
    },
    code: { font: "Consolas", size: 9.5, background: "F3F5F7", border: "D8DEE4" },
    quote: { border: "AAB7C4", borderSize: 2, indentation: 0.35 },
    table: { border: "B8C2CC", headerBackground: "E8EEF5", cellPadding: 0.08 },
    links: { color: "0563C1" },
    math: { border: "666666" },
    horizontalRule: { color: "B8C2CC", size: 1 },
  },
  academic: {
    body: {
      font: "Times New Roman",
      size: 12,
      color: "111111",
      lineSpacing: 1.35,
      paragraphAfter: 7,
    },
    headings: {
      h1: heading("Times New Roman", 18, "111111", 18, 9),
      h2: heading("Times New Roman", 15, "222222", 14, 7),
      h3: heading("Times New Roman", 13, "333333", 11, 5),
      h4: heading("Times New Roman", 12, "333333", 9, 4),
      h5: heading("Times New Roman", 11, "444444", 8, 4),
      h6: heading("Times New Roman", 10, "555555", 8, 4),
    },
    code: { font: "Courier New", size: 9, background: "F7F7F7", border: "BBBBBB" },
    quote: { border: "777777", borderSize: 2, indentation: 0.4 },
    table: { border: "777777", headerBackground: "EDEDED", cellPadding: 0.09 },
    links: { color: "1A5FB4" },
    math: { border: "555555" },
    horizontalRule: { color: "777777", size: 1 },
  },
  minimal: {
    body: { font: "Aptos", size: 10.5, color: "202124", lineSpacing: 1.15, paragraphAfter: 5 },
    headings: {
      h1: heading("Aptos Display", 17, "202124", 14, 7),
      h2: heading("Aptos Display", 14, "202124", 11, 5),
      h3: heading("Aptos", 12, "303134", 9, 4),
      h4: heading("Aptos", 11, "303134", 8, 3),
      h5: heading("Aptos", 10.5, "5F6368", 7, 3),
      h6: heading("Aptos", 10, "5F6368", 7, 3),
    },
    code: { font: "Cascadia Mono", size: 9, background: "F8F9FA", border: "DADCE0" },
    quote: { border: "DADCE0", borderSize: 1, indentation: 0.3 },
    table: { border: "DADCE0", headerBackground: "F8F9FA", cellPadding: 0.07 },
    links: { color: "1967D2" },
    math: { border: "9AA0A6" },
    horizontalRule: { color: "DADCE0", size: 1 },
  },
};
function merge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key];
    if (value !== undefined)
      result[key] = (
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? merge(base[key] as object, value as object)
          : value
      ) as T[keyof T];
  }
  return result;
}
export function resolveTheme(theme: ThemeName | Partial<DocumentTheme> | undefined): DocumentTheme {
  if (!theme) return structuredClone(themes.default);
  if (typeof theme === "string") return structuredClone(themes[theme]);
  return merge(structuredClone(themes.default), theme);
}
