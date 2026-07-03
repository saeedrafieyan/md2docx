import { marked, type Token } from "marked";
import { normalizeMarkdown } from "./normalize-markdown.js";
export function parseMarkdown(markdown: string): Token[] {
  return marked.lexer(normalizeMarkdown(markdown), { gfm: true });
}
