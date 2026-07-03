import { describe, expect, it } from "vitest";
import { MathConversionError } from "../src/core/errors.js";
import { convertMarkdownToBuffer } from "../src/core/convert.js";
import { parseLatex } from "../src/math/parse-latex.js";
import { packageXml } from "./helpers.js";
const supported = [
  "\\frac{a}{b}",
  "\\frac{1}{1+\\frac{x}{y}}",
  "x_i^2",
  "\\sum_{i=1}^{n} x_i",
  "\\prod_{i=1}^{n} x_i",
  "\\int_0^H f(z)\\,dz",
  "\\sqrt{x}",
  "\\sqrt[n]{x}",
  "\\lim_{x \\to 0} \\frac{\\sin x}{x}",
  "\\alpha + \\beta = \\gamma",
  "\\boxed{E_{\\mathrm{eff}} = 0.116\\ \\mathrm{MPa}}",
];
describe("math conversion", () => {
  it.each(supported)("parses %s", (source) => {
    expect(parseLatex(source, { unsupportedMathStrategy: "error" }).ast).not.toBeNull();
  });
  it("renders native OMML without supported raw commands", async () => {
    const markdown = supported.map((value) => `$$${value}$$`).join("\n\n"),
      result = await convertMarkdownToBuffer(markdown),
      xml = (await packageXml(result.output)).document;
    expect((xml.match(/<m:oMath>/g) ?? []).length).toBe(supported.length);
    expect(xml).toContain("<m:f>");
    expect(xml).toContain("<m:rad>");
    expect(xml).toContain("<m:nary>");
    expect(xml).not.toMatch(/\\(?:frac|sqrt|sum|int|boxed)/);
    expect(result.warnings).toHaveLength(0);
  });
  it("warns and visibly preserves unsupported math", async () => {
    const result = await convertMarkdownToBuffer("$$\\overset{?}{=}$$");
    expect(result.warnings[0]?.code).toBe("UNSUPPORTED_MATH_COMMAND");
    expect((await packageXml(result.output)).document).toContain("Unconverted equation");
  });
  it("throws a typed error in error mode", () => {
    expect(() => parseLatex("\\overset{?}{=}", { unsupportedMathStrategy: "error" })).toThrow(
      MathConversionError,
    );
  });
  it("rejects unmatched delimiters", () => {
    expect(parseLatex("x}", { unsupportedMathStrategy: "warn-and-preserve" }).ast).toBeNull();
  });
  it("rejects matrix environments instead of corrupting them", () => {
    const result = parseLatex("\\begin{matrix}a&b\\end{matrix}", {
      unsupportedMathStrategy: "warn-and-preserve",
    });
    expect(result.ast).toBeNull();
    expect(result.warnings[0]?.message).toContain("matrix");
  });
});
