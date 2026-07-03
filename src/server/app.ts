import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import express, { type NextFunction, type Request, type Response } from "express";
import { convertMarkdownToBuffer } from "../core/convert.js";
import type { ConversionOptions, ConversionWarning } from "../core/types.js";
import { sanitizeFilename } from "./filename.js";
const execFileAsync = promisify(execFile);
interface RequestData {
  markdown: string;
  filename: string;
  options: ConversionOptions;
}
function requestData(req: Request, res: Response): RequestData | null {
  const markdown = (req.body as Record<string, unknown> | undefined)?.markdown;
  if (typeof markdown !== "string" || !markdown.trim()) {
    res.status(400).json({ error: "Please provide some Markdown." });
    return null;
  }
  const body = req.body as Record<string, unknown>;
  const options: ConversionOptions = {
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    pageSize: body.pageSize === "a4" ? "a4" : "letter",
    theme: body.theme === "academic" || body.theme === "minimal" ? body.theme : "default",
    unsupportedMathStrategy: "warn-and-preserve",
  };
  return { markdown, filename: sanitizeFilename(body.filename), options };
}
function warningHeaders(res: Response, warnings: ConversionWarning[]): void {
  res.setHeader("X-MD2DOCX-Warning-Count", String(warnings.length));
  if (warnings.length) {
    const encoded = Buffer.from(JSON.stringify(warnings)).toString("base64url");
    if (encoded.length < 7000) res.setHeader("X-MD2DOCX-Warnings", encoded);
  }
}
export function createApp() {
  const app = express();
  const publicRoot = path.resolve("public");
  app.use(express.json({ limit: "10mb" }));
  app.use(express.static(publicRoot));
  app.post("/api/convert", async (req, res) => {
    const data = requestData(req, res);
    if (!data) return;
    try {
      const result = await convertMarkdownToBuffer(data.markdown, data.options);
      warningHeaders(res, result.warnings);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${data.filename}.docx"`);
      res.send(result.output);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not convert this Markdown file." });
    }
  });
  app.post("/api/convert-pdf", async (req, res) => {
    const data = requestData(req, res);
    if (!data) return;
    if (process.platform !== "win32")
      return res
        .status(501)
        .json({ error: "PDF conversion currently requires Windows and Microsoft Word." });
    const jobDir = path.join(os.tmpdir(), `md2docx-${randomUUID()}`),
      docxPath = path.join(jobDir, "source.docx"),
      pdfPath = path.join(jobDir, "result.pdf");
    try {
      const result = await convertMarkdownToBuffer(data.markdown, data.options);
      warningHeaders(res, result.warnings);
      await fs.mkdir(jobDir, { recursive: true });
      await fs.writeFile(docxPath, result.output);
      await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          path.resolve("scripts/docx-to-pdf.ps1"),
          "-InputPath",
          docxPath,
          "-OutputPath",
          pdfPath,
        ],
        { windowsHide: true, timeout: 120000 },
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${data.filename}.pdf"`);
      res.send(await fs.readFile(pdfPath));
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error:
          "Could not create the PDF. Make sure Microsoft Word is installed and not showing a dialog.",
      });
    } finally {
      await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 400;
    res
      .status(status)
      .json({ error: status === 413 ? "Request is too large." : "Invalid JSON request." });
  });
  return app;
}
