import { Document, PageOrientation } from "docx";
import type { ConversionContext } from "../core/types.js";
import { renderBlocks } from "../markdown/block-parser.js";
import { parseMarkdown } from "../markdown/parse-markdown.js";
import { numbering } from "./numbering.js";
import { pageLayout } from "./page-layout.js";
import { documentStyles } from "./styles.js";
export async function createDocument(
  markdown: string,
  context: ConversionContext,
): Promise<Document> {
  const layout = pageLayout(context.options);
  return new Document({
    creator: context.options.author ?? "md2docx",
    title: context.options.title ?? "Converted Markdown",
    description:
      context.options.description ?? "Converted from Markdown while preserving structure",
    styles: documentStyles(context.theme),
    numbering,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: layout.width,
              height: layout.height,
              orientation:
                context.options.orientation === "landscape"
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT,
            },
            margin: { ...layout.margins, header: 708, footer: 708 },
          },
        },
        children: await renderBlocks(parseMarkdown(markdown), context),
      },
    ],
  });
}
