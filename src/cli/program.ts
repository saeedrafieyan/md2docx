import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { convertMarkdownToBuffer } from "../core/convert.js";
import type { ThemeName } from "../document/themes.js";
export function createCli(): Command {
  return new Command()
    .name("md2docx")
    .description("Convert Markdown to a structured Word document")
    .argument("<input>", "Markdown file")
    .option("-o, --output <file>", "Output DOCX file")
    .option("--page-size <size>", "a4 or letter", "letter")
    .option("--theme <theme>", "default, academic, or minimal", "default")
    .option("--title <title>", "Document title")
    .option("--author <author>", "Document author")
    .option("--math-errors", "Fail on unsupported math", false)
    .action(
      async (
        input: string,
        options: {
          output?: string;
          pageSize: string;
          theme: string;
          title?: string;
          author?: string;
          mathErrors: boolean;
        },
      ) => {
        if (!["a4", "letter"].includes(options.pageSize))
          throw new Error(`Invalid page size: ${options.pageSize}`);
        if (!["default", "academic", "minimal"].includes(options.theme))
          throw new Error(`Invalid theme: ${options.theme}`);
        const markdown = await fs.readFile(input, "utf8"),
          output =
            options.output ??
            path.join(path.dirname(input), `${path.basename(input, path.extname(input))}.docx`),
          result = await convertMarkdownToBuffer(markdown, {
            title: options.title ?? path.basename(input, path.extname(input)),
            ...(options.author ? { author: options.author } : {}),
            pageSize: options.pageSize as "a4" | "letter",
            theme: options.theme as ThemeName,
            imageBasePath: path.dirname(path.resolve(input)),
            unsupportedMathStrategy: options.mathErrors ? "error" : "warn-and-preserve",
          });
        await fs.writeFile(output, result.output);
        for (const warning of result.warnings)
          console.error(`warning ${warning.code}: ${warning.message}`);
        console.log(`Created ${path.resolve(output)}`);
      },
    );
}
