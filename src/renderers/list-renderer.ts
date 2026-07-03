import { Paragraph } from "docx";
import type { Tokens } from "marked";
import type { ConversionContext } from "../core/types.js";
import { renderInline } from "../markdown/inline-parser.js";
export async function renderList(
  token: Tokens.List,
  context: ConversionContext,
  level = 0,
): Promise<Paragraph[]> {
  if (level === 0) context.statistics.lists++;
  const output: Paragraph[] = [];
  for (const item of token.items) {
    const first = item.tokens.find(
      (child) => child.type === "text" || child.type === "paragraph",
    ) as Tokens.Text | Tokens.Paragraph | undefined;
    output.push(
      new Paragraph({
        children: await renderInline(first?.tokens ?? [], context),
        numbering: {
          reference: token.ordered ? "md-numbers" : "md-bullets",
          level: Math.min(level, 5),
        },
        spacing: { after: 80, line: 280 },
      }),
    );
    for (const child of item.tokens) {
      if (child.type === "list")
        output.push(...(await renderList(child as Tokens.List, context, level + 1)));
      else if (child !== first && (child.type === "text" || child.type === "paragraph"))
        output.push(
          new Paragraph({
            children: await renderInline(
              (child as Tokens.Text | Tokens.Paragraph).tokens ?? [],
              context,
            ),
            indent: { left: 720 * (level + 1) },
          }),
        );
    }
  }
  return output;
}
