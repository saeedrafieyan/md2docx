import { AlignmentType, BorderStyle, Paragraph, TextRun } from "docx";
import type { Token } from "marked";
import type { ConversionContext } from "../core/types.js";
import { addWarning } from "../core/warnings.js";
import { renderInline } from "../markdown/inline-parser.js";
import { parseLatex } from "../math/parse-latex.js";
import { renderEquation } from "../math/omml-renderer.js";
export async function renderParagraph(
  token: { tokens?: Token[]; text?: string },
  context: ConversionContext,
  quote = false,
): Promise<Paragraph> {
  context.statistics.paragraphs++;
  return new Paragraph({
    children: await renderInline(token.tokens ?? [], context),
    spacing: {
      after: Math.round(context.theme.body.paragraphAfter * 20),
      line: Math.round(context.theme.body.lineSpacing * 240),
    },
    ...(quote
      ? {
          indent: { left: Math.round(context.theme.quote.indentation * 1440) },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: context.theme.quote.borderSize * 8,
              color: context.theme.quote.border,
              space: 10,
            },
          },
        }
      : {}),
  });
}
export function renderDisplayMath(source: string, context: ConversionContext): Paragraph {
  const result = parseLatex(source, {
    unsupportedMathStrategy: context.options.unsupportedMathStrategy,
  });
  for (const warning of result.warnings) addWarning(context, warning);
  if (!result.ast)
    return new Paragraph({
      children: [
        new TextRun({ text: `[Unconverted equation: ${source}]`, color: "C00000", italics: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 160 },
    });
  context.statistics.equations++;
  const boxed = /\\boxed\s*\{/.test(source),
    total = Math.round(context.contentWidthPixels * 15),
    visible = source.replace(/\\[A-Za-z]+/g, "x").replace(/[{}]/g, "").length,
    width = Math.min(total - 600, Math.max(1800, 900 + visible * 85)),
    indent = Math.max(0, Math.round((total - width) / 2));
  return new Paragraph({
    children: [renderEquation(result.ast)],
    alignment: AlignmentType.CENTER,
    ...(boxed
      ? {
          border: Object.fromEntries(
            ["top", "bottom", "left", "right"].map((side) => [
              side,
              { style: BorderStyle.SINGLE, size: 4, color: context.theme.math.border, space: 3 },
            ]),
          ),
          indent: { left: indent, right: indent },
        }
      : {}),
    spacing: { before: 80, after: 120, line: 280 },
  });
}
