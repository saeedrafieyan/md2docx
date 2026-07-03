import { BorderStyle, Paragraph } from "docx";
import type { ConversionContext } from "../core/types.js";
export function renderHorizontalRule(context: ConversionContext): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: context.theme.horizontalRule.size * 8,
        color: context.theme.horizontalRule.color,
        space: 8,
      },
    },
    spacing: { after: 160 },
  });
}
