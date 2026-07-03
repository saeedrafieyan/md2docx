export function normalizeMarkdown(markdown: string): string {
  return markdown.replace(
    /^\s*\[\s*\r?\n([\s\S]*?)\r?\n\s*\]\s*$/gm,
    (_, body: string) => `\n$$${body.trim()}$$\n`,
  );
}
