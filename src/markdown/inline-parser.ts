import { ExternalHyperlink, ShadingType, TextRun, type ParagraphChild } from "docx";
import type { Token, Tokens } from "marked";
import type { ConversionContext } from "../core/types.js";
import { addWarning } from "../core/warnings.js";
import { resolveImage } from "../images/image-resolver.js";
import { renderImage } from "../images/image-renderer.js";
import { parseLatex } from "../math/parse-latex.js";
import { renderEquation } from "../math/omml-renderer.js";
export interface InlineStyle {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  color?: string;
  underline?: boolean;
}
export function decodeHtml(text: string): string {
  return text.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (all, entity: string) => {
    if (entity.startsWith("#")) {
      const hex = entity[1]?.toLowerCase() === "x",
        value = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : all;
    }
    return (
      (
        { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: "\u00a0" } as Record<
          string,
          string
        >
      )[entity.toLowerCase()] ?? all
    );
  });
}
function textRun(text: string, context: ConversionContext, style: InlineStyle = {}): TextRun {
  return new TextRun({
    text,
    font: context.theme.body.font,
    size: Math.round(context.theme.body.size * 2),
    ...(style.bold ? { bold: true } : {}),
    ...(style.italics ? { italics: true } : {}),
    ...(style.strike ? { strike: true } : {}),
    ...(style.color ? { color: style.color } : {}),
    ...(style.underline ? { underline: {} } : {}),
  });
}
type Part = { type: "text"; value: string } | { type: "math"; value: string };
export function detectInlineMath(text: string): Part[] {
  const parts: Part[] = [];
  let plain = 0,
    index = 0;
  const push = (start: number, end: number, math: string) => {
    if (start > plain) parts.push({ type: "text", value: text.slice(plain, start) });
    parts.push({ type: "math", value: math });
    plain = end;
  };
  while (index < text.length) {
    if (text[index] === "$" && text[index + 1] !== "$") {
      const end = text.indexOf("$", index + 1);
      if (end > index + 1) {
        push(index, end + 1, text.slice(index + 1, end));
        index = end + 1;
        continue;
      }
    }
    if (text[index] === "\\" && text[index + 1] === "(") {
      const end = text.indexOf("\\)", index + 2);
      if (end > index + 2) {
        push(index, end + 2, text.slice(index + 2, end));
        index = end + 2;
        continue;
      }
    }
    if (text[index] === "(") {
      let depth = 1,
        end = index + 1;
      for (; end < text.length && depth; end++) {
        if (text[end] === "(") depth++;
        else if (text[end] === ")") depth--;
      }
      if (!depth) {
        const value = text.slice(index + 1, end - 1);
        if (
          value.length <= 160 &&
          /(?:\\[A-Za-z]+|[_^=]|[A-Za-z0-9]\s*\/\s*[A-Za-z0-9])/.test(value)
        ) {
          let start = index,
            math = value;
          if (/^\^\{[^{}]+\}$/.test(value)) {
            let unit = index;
            while (unit > plain && /[A-Za-z]/.test(text[unit - 1] ?? "")) unit--;
            if (unit < index) {
              start = unit;
              math = `\\mathrm{${text.slice(unit, index)}}${value}`;
            }
          }
          push(start, end, math);
          index = end;
          continue;
        }
      }
    }
    index++;
  }
  if (plain < text.length) parts.push({ type: "text", value: text.slice(plain) });
  return parts.length ? parts : [{ type: "text", value: text }];
}
function mathChildren(
  text: string,
  context: ConversionContext,
  style: InlineStyle,
): ParagraphChild[] {
  return detectInlineMath(text).flatMap((part) => {
    if (part.type === "text") return [textRun(part.value, context, style)];
    const result = parseLatex(part.value, {
      unsupportedMathStrategy: context.options.unsupportedMathStrategy,
    });
    for (const warning of result.warnings) addWarning(context, warning);
    if (!result.ast)
      return [
        textRun(`[Unconverted equation: ${part.value}]`, context, { ...style, color: "C00000" }),
      ];
    context.statistics.equations++;
    return [renderEquation(result.ast)];
  });
}
export async function renderInline(
  tokens: Token[],
  context: ConversionContext,
  style: InlineStyle = {},
): Promise<ParagraphChild[]> {
  const output: ParagraphChild[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "text":
      case "escape": {
        const item = token as Tokens.Text;
        if (item.tokens) output.push(...(await renderInline(item.tokens, context, style)));
        else output.push(...mathChildren(decodeHtml(item.text), context, style));
        break;
      }
      case "strong":
        output.push(
          ...(await renderInline((token as Tokens.Strong).tokens, context, {
            ...style,
            bold: true,
          })),
        );
        break;
      case "em":
        output.push(
          ...(await renderInline((token as Tokens.Em).tokens, context, {
            ...style,
            italics: true,
          })),
        );
        break;
      case "del":
        output.push(
          ...(await renderInline((token as Tokens.Del).tokens, context, {
            ...style,
            strike: true,
          })),
        );
        break;
      case "codespan":
        output.push(
          new TextRun({
            text: decodeHtml((token as Tokens.Codespan).text),
            font: context.theme.code.font,
            size: Math.round(context.theme.code.size * 2),
            shading: { type: ShadingType.CLEAR, fill: context.theme.code.background },
          }),
        );
        break;
      case "br":
        output.push(new TextRun({ break: 1 }));
        break;
      case "link": {
        const link = token as Tokens.Link;
        output.push(
          new ExternalHyperlink({
            link: link.href,
            children: await renderInline(link.tokens, context, {
              ...style,
              color: context.theme.links.color,
              underline: true,
            }),
          }),
        );
        break;
      }
      case "image": {
        const image = token as Tokens.Image;
        const asset = await resolveImage(image.href, image.text, image.title ?? undefined, context);
        if (asset) {
          output.push(renderImage(asset, context));
          context.statistics.images++;
        } else
          output.push(
            textRun(`[Image unavailable: ${image.text || image.href}]`, context, {
              italics: true,
              color: "C00000",
            }),
          );
        break;
      }
      default:
        if ("tokens" in token && Array.isArray(token.tokens))
          output.push(...(await renderInline(token.tokens, context, style)));
        else if ("raw" in token)
          output.push(textRun(decodeHtml(String(token.raw)), context, style));
    }
  }
  return output.length ? output : [textRun("", context, style)];
}
