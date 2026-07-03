export * from "./core/types.js";
export * from "./core/errors.js";
export * from "./core/convert.js";
export * from "./document/themes.js";
export * from "./document/measurements.js";
export type {
  AssetResolver,
  AssetResolutionContext,
  ResolvedAsset,
  SupportedImageMime,
} from "./images/image-types.js";
import type { ConversionOptions } from "./core/types.js";
import { convertMarkdownToBuffer } from "./core/convert.js";
export async function markdownToDocx(
  markdown: string,
  options: ConversionOptions = {},
): Promise<Buffer> {
  return (await convertMarkdownToBuffer(markdown, options)).output;
}
