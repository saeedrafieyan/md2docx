import { describe, expect, it } from "vitest";
import {
  centimetersToTwips,
  inchesToTwips,
  pixelsToEmus,
  pointsToHalfPoints,
} from "../src/document/measurements.js";
import { resolveTheme, themes } from "../src/document/themes.js";
import { normalizeMarkdown } from "../src/markdown/normalize-markdown.js";
import { decodeHtml, detectInlineMath } from "../src/markdown/inline-parser.js";
import { tableColumnWidths } from "../src/renderers/table-renderer.js";
import { sanitizeFilename } from "../src/server/filename.js";
describe("core helpers", () => {
  it("converts document units", () => {
    expect(pointsToHalfPoints(11)).toBe(22);
    expect(inchesToTwips(1)).toBe(1440);
    expect(centimetersToTwips(2.54)).toBe(1440);
    expect(pixelsToEmus(96)).toBe(914400);
  });
  it("deep merges themes without mutating defaults", () => {
    const theme = resolveTheme({ body: { ...themes.default.body, font: "Inter" } });
    expect(theme.body.font).toBe("Inter");
    expect(theme.table.border).toBe(themes.default.table.border);
    expect(themes.default.body.font).toBe("Calibri");
    expect(resolveTheme("academic").body.font).toBe("Times New Roman");
  });
  it("normalizes bracket display math", () => {
    expect(normalizeMarkdown("before\n\n[\n\\frac{a}{b}\n]\n\nafter")).toContain(
      "$$\\frac{a}{b}$$",
    );
  });
  it("decodes named and numeric entities", () => {
    expect(decodeHtml("Tom&#39;s &amp; &#x03B1;")).toBe("Tom's & α");
  });
  it("detects inline math dialects", () => {
    const parts = detectInlineMath("Use $x_i^2$, (x=t/T), and min(^{-1}).");
    expect(parts.filter((x) => x.type === "math").map((x) => x.value)).toEqual([
      "x_i^2",
      "x=t/T",
      "\\mathrm{min}^{-1}",
    ]);
  });
  it("allocates exact table width", () => {
    const widths = tableColumnWidths(100, 3);
    expect(widths).toEqual([33, 33, 34]);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("sanitizes download names", () => {
    expect(sanitizeFilename(" report / final.md ")).toBe("report-final");
    expect(sanitizeFilename("***")).toBe("document");
  });
});
