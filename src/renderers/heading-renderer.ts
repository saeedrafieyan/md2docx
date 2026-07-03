import { HeadingLevel, Paragraph } from "docx";
import type { Token } from "marked";
import type { ConversionContext } from "../core/types.js";
import { renderInline } from "../markdown/inline-parser.js";
const levels = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;
export async function renderHeading(
  token: { depth: number; tokens: Token[] },
  context: ConversionContext,
): Promise<Paragraph> {
  context.statistics.headings++;
  const style =
    context.theme.headings[
      `h${Math.min(6, Math.max(1, token.depth))}` as keyof typeof context.theme.headings
    ];
  return new Paragraph({
    children: await renderInline(token.tokens, context, { bold: style.bold, color: style.color }),
    heading: levels[Math.min(5, Math.max(0, token.depth - 1))]!,
    keepNext: true,
    spacing: { before: style.before * 20, after: style.after * 20 },
  });
}
