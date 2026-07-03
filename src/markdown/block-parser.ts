import { Paragraph, type FileChild } from "docx";
import type { Token, Tokens } from "marked";
import type { ConversionContext } from "../core/types.js";
import { displayMathSource } from "./detect-math.js";
import { renderCode } from "../renderers/code-renderer.js";
import { renderHeading } from "../renderers/heading-renderer.js";
import { renderHorizontalRule } from "../renderers/horizontal-rule-renderer.js";
import { renderList } from "../renderers/list-renderer.js";
import { renderDisplayMath, renderParagraph } from "../renderers/paragraph-renderer.js";
import { renderTable } from "../renderers/table-renderer.js";
export async function renderBlocks(
  tokens: Token[],
  context: ConversionContext,
  quote = false,
): Promise<FileChild[]> {
  const output: FileChild[] = [];
  for (const token of tokens) {
    const math = token.type === "paragraph" ? displayMathSource((token.raw ?? "").trim()) : null;
    if (math !== null) {
      output.push(renderDisplayMath(math, context));
      continue;
    }
    switch (token.type) {
      case "heading":
        output.push(await renderHeading(token as Tokens.Heading, context));
        break;
      case "paragraph":
        output.push(await renderParagraph(token as Tokens.Paragraph, context, quote));
        break;
      case "list":
        output.push(...(await renderList(token as Tokens.List, context)));
        break;
      case "blockquote":
        output.push(...(await renderBlocks((token as Tokens.Blockquote).tokens, context, true)));
        break;
      case "code":
        output.push(renderCode((token as Tokens.Code).text, context));
        break;
      case "table":
        output.push(
          await renderTable(token as Tokens.Table, context),
          new Paragraph({ spacing: { after: 80 } }),
        );
        break;
      case "hr":
        output.push(renderHorizontalRule(context));
        break;
      case "space":
        break;
      default:
        if ("tokens" in token && Array.isArray(token.tokens))
          output.push(...(await renderBlocks(token.tokens, context, quote)));
    }
  }
  return output;
}
