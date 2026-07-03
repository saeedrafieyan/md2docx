export function sanitizeFilename(value: unknown): string {
  return (
    (typeof value === "string" ? value : "document")
      .trim()
      .replace(/\.md$/i, "")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "document"
  );
}
