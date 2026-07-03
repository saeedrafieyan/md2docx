import { Packer, type Document } from "docx";
import { InvalidConfigurationError } from "./errors.js";
import type { ConversionContext, ConversionOptions, ConversionResult } from "./types.js";
import { emptyStatistics } from "./warnings.js";
import { createDocument } from "../document/create-document.js";
import { pageLayout } from "../document/page-layout.js";
import { resolveTheme, themes } from "../document/themes.js";
function context(options: ConversionOptions): ConversionContext {
  if (typeof options.theme === "string" && !(options.theme in themes))
    throw new InvalidConfigurationError(`Unknown theme: ${options.theme}`);
  const normalized = {
    pageSize: options.pageSize ?? "letter",
    orientation: options.orientation ?? "portrait",
    allowRemoteImages: options.allowRemoteImages ?? false,
    unsupportedMathStrategy: options.unsupportedMathStrategy ?? "warn-and-preserve",
    remoteImageTimeoutMs: options.remoteImageTimeoutMs ?? 5000,
    maxRemoteImageBytes: options.maxRemoteImageBytes ?? 10 * 1024 * 1024,
    ...options,
  };
  const layout = pageLayout(normalized);
  return {
    options: normalized,
    theme: resolveTheme(options.theme),
    warnings: [],
    statistics: emptyStatistics(),
    contentWidthPixels: (layout.contentWidth / 1440) * 96,
  };
}
export async function buildMarkdownDocument(
  markdown: string,
  options: ConversionOptions = {},
): Promise<ConversionResult<Document>> {
  const state = context(options),
    output = await createDocument(markdown, state);
  return { output, warnings: state.warnings, statistics: state.statistics };
}
export async function convertMarkdownToBuffer(
  markdown: string,
  options: ConversionOptions = {},
): Promise<ConversionResult<Buffer>> {
  const built = await buildMarkdownDocument(markdown, options);
  return { ...built, output: await Packer.toBuffer(built.output) };
}
export async function convertMarkdownToBlob(
  markdown: string,
  options: ConversionOptions = {},
): Promise<ConversionResult<Blob>> {
  const result = await convertMarkdownToBuffer(markdown, options);
  return {
    ...result,
    output: new Blob([Uint8Array.from(result.output)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  };
}
