import { describe, expect, it } from "vitest";
import { convertMarkdownToBlob, convertMarkdownToBuffer, markdownToDocx } from "../src/index.js";
import { packageXml } from "./helpers.js";
const complex = [
  "# Heading",
  "",
  "Polish: Za\u017c\u00f3\u0142\u0107 g\u0119\u015bl\u0105 ja\u017a\u0144. Persian: \u0641\u0627\u0631\u0633\u06cc. Apostrophe: user's.",
  "",
  "> A **quoted** idea.",
  "",
  "1. Ordered",
  "   - Nested unordered",
  "   - Second",
  "2. Next",
  "",
  "- Unordered",
  "  1. Nested ordered",
  "",
  "| Name | Value |",
  "|---|---:|",
  "| \u03b1 | 2 |",
  "",
  "`inline code` and [link](https://example.com).",
  "",
  "~~~ts",
  "const value = 1;",
  "~~~",
  "",
  "---",
  "",
  "$$x_i^2+\\frac{a}{b}$$",
].join("\n");
describe("DOCX integration", () => {
  it("preserves supported Markdown structures and Unicode", async () => {
    const result = await convertMarkdownToBuffer(complex, {
      theme: "academic",
      pageSize: "a4",
      title: "Research",
    });
    const pkg = await packageXml(result.output);
    expect(result.output.subarray(0, 2).toString()).toBe("PK");
    expect(pkg.document).toContain("Heading");
    expect(pkg.document).toContain("Za\u017c\u00f3\u0142\u0107");
    expect(pkg.document).toContain("\u0641\u0627\u0631\u0633\u06cc");
    expect(pkg.document).toContain("<w:tbl>");
    expect(pkg.document).toContain("<m:oMath>");
    expect(pkg.numbering).toContain("abstractNum");
    expect(pkg.relationships).toContain("hyperlink");
    expect(pkg.styles).toContain("Times New Roman");
    expect(result.statistics).toMatchObject({
      headings: 1,
      tables: 1,
      codeBlocks: 1,
      equations: 1,
    });
  });
  it("produces different A4 and Letter dimensions", async () => {
    const a4 = (await packageXml((await convertMarkdownToBuffer("# A", { pageSize: "a4" })).output))
      .document;
    const letter = (
      await packageXml((await convertMarkdownToBuffer("# A", { pageSize: "letter" })).output)
    ).document;
    expect(a4.match(/<w:pgSz[^>]+>/)?.[0]).not.toBe(letter.match(/<w:pgSz[^>]+>/)?.[0]);
  });
  it("handles empty and malformed Markdown", async () => {
    for (const markdown of ["", "**unclosed [link("])
      expect((await convertMarkdownToBuffer(markdown)).output.subarray(0, 2).toString()).toBe("PK");
  });
  it("retains the legacy buffer API and offers Blob serialization", async () => {
    expect(await markdownToDocx("hello")).toBeInstanceOf(Buffer);
    const result = await convertMarkdownToBlob("hello");
    expect(result.output).toBeInstanceOf(Blob);
    expect(result.output.type).toContain("wordprocessingml");
  });
});
