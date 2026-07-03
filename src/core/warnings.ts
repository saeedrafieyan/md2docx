import type { ConversionContext, ConversionStatistics, ConversionWarning } from "./types.js";
export function emptyStatistics(): ConversionStatistics {
  return {
    headings: 0,
    paragraphs: 0,
    lists: 0,
    tables: 0,
    codeBlocks: 0,
    equations: 0,
    images: 0,
    warnings: 0,
  };
}
export function addWarning(context: ConversionContext, warning: ConversionWarning): void {
  context.warnings.push(warning);
  context.statistics.warnings = context.warnings.length;
}
