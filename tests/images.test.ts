import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertMarkdownToBuffer } from "../src/core/convert.js";
import { packageXml } from "./helpers.js";
const fixtures = path.resolve("tests/fixtures");
describe("image embedding", () => {
  it("embeds local PNG and JPEG with relationships and alt text", async () => {
    const result = await convertMarkdownToBuffer("![wide alt](wide.png)\n\n![orange](sample.jpg)", {
        imageBasePath: fixtures,
      }),
      pkg = await packageXml(result.output),
      media = Object.keys(pkg.zip.files).filter(
        (name) => name.startsWith("word/media/") && !name.endsWith("/"),
      );
    expect(media).toHaveLength(2);
    expect(pkg.relationships.match(/relationships\/image/g)).toHaveLength(2);
    expect(pkg.document).toContain("wide alt");
    expect(result.statistics.images).toBe(2);
  });
  it("embeds a base64 PNG", async () => {
    const data = (await fs.readFile(path.join(fixtures, "wide.png"))).toString("base64"),
      result = await convertMarkdownToBuffer(`![data](data:image/png;base64,${data})`),
      pkg = await packageXml(result.output);
    expect(Object.keys(pkg.zip.files).some((name) => name.startsWith("word/media/"))).toBe(true);
  });
  it("warns for missing relative images without a base path", async () => {
    const result = await convertMarkdownToBuffer("![missing](nope.png)");
    expect(result.warnings[0]?.code).toBe("IMAGE_BASE_PATH_REQUIRED");
    expect((await packageXml(result.output)).document).toContain("Image unavailable");
  });
  it("warns for missing, unsupported, unsafe, and disabled remote images", async () => {
    const cases = [
      ["![x](missing.png)", { imageBasePath: fixtures }, "IMAGE_NOT_FOUND"],
      ["![x](unsupported.txt)", { imageBasePath: fixtures }, "UNSUPPORTED_IMAGE_TYPE"],
      ["![x](javascript:alert.png)", {}, "UNSAFE_IMAGE_PROTOCOL"],
      ["![x](https://example.com/a.png)", {}, "REMOTE_IMAGE_DISABLED"],
    ] as const;
    for (const [markdown, options, code] of cases) {
      expect((await convertMarkdownToBuffer(markdown, options)).warnings[0]?.code).toBe(code);
    }
  });
  it("scales wide images to the content width", async () => {
    const result = await convertMarkdownToBuffer("![wide](wide.png)", {
        imageBasePath: fixtures,
        pageSize: "a4",
      }),
      xml = (await packageXml(result.output)).document,
      extent = xml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);
    expect(Number(extent?.[1])).toBeLessThanOrEqual(7_000_000);
    expect(Number(extent?.[1]) / Number(extent?.[2])).toBeCloseTo(6, 1);
  });
  it("embeds GIF first-frame data and SVG with a fallback", async () => {
    const result = await convertMarkdownToBuffer("![gif](sample.gif)\n\n![svg](sample.svg)", {
      imageBasePath: fixtures,
    });
    const pkg = await packageXml(result.output);
    const media = Object.keys(pkg.zip.files).filter(
      (name) => name.startsWith("word/media/") && !name.endsWith("/"),
    );
    expect(media.some((name) => name.endsWith(".gif"))).toBe(true);
    expect(media.some((name) => name.endsWith(".svg"))).toBe(true);
  });
  it("supports absolute local paths and warns for inaccessible remote images", async () => {
    const absolute = path.join(fixtures, "sample.jpg").replace(/\\/g, "/");
    expect((await convertMarkdownToBuffer(`![absolute](${absolute})`)).statistics.images).toBe(1);
    const remote = await convertMarkdownToBuffer("![remote](http://127.0.0.1:9/unavailable.png)", {
      allowRemoteImages: true,
      remoteImageTimeoutMs: 100,
    });
    expect(remote.warnings[0]?.code).toBe("IMAGE_FETCH_FAILED");
  });
});
