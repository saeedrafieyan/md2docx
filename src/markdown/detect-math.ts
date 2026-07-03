export function displayMathSource(raw: string): string | null {
  const text = raw.trim();
  return text.startsWith("$$") && text.endsWith("$$") && text.length >= 4
    ? text.slice(2, -2).trim()
    : null;
}
