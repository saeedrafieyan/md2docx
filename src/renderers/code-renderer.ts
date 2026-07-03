import { BorderStyle, Paragraph, ShadingType, TextRun } from "docx";
import type { ConversionContext } from "../core/types.js";
export function renderCode(text: string, context: ConversionContext): Paragraph {
  context.statistics.codeBlocks++;
  const children: TextRun[] = [];
  text.split("\n").forEach((line, index, all) => {
    children.push(
      new TextRun({
        text: line,
        font: context.theme.code.font,
        size: Math.round(context.theme.code.size * 2),
      }),
    );
    if (index < all.length - 1) children.push(new TextRun({ break: 1 }));
  });
  const border = Object.fromEntries(
    ["top", "bottom", "left", "right"].map((side) => [
      side,
      { style: BorderStyle.SINGLE, size: 4, color: context.theme.code.border },
    ]),
  );
  return new Paragraph({
    children,
    shading: { type: ShadingType.CLEAR, fill: context.theme.code.background },
    border,
    indent: { left: 180, right: 180 },
    spacing: { before: 80, after: 160, line: 240 },
  });
}
