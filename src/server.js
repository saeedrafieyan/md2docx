import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import express from "express";
import { markdownToDocx } from "./converter.js";

const execFileAsync = promisify(execFile);
const app = express();
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pdfScript = path.join(root, "src", "docx-to-pdf.ps1");
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(root, "public")));

function requestData(req, res) {
    const markdown = req.body?.markdown;
    if (typeof markdown !== "string" || !markdown.trim()) {
        res.status(400).json({ error: "Please provide some Markdown." });
        return null;
    }
    const filename = String(req.body?.filename || "document").replace(/\.md$/i, "").replace(/[^a-z0-9._-]+/gi, "-") || "document";
    return { markdown, filename };
}

app.post("/api/convert", async (req, res) => {
    const data = requestData(req, res);
    if (!data) return;
    try {
        const buffer = await markdownToDocx(data.markdown, { title: data.filename });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${data.filename}.docx"`);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not convert this Markdown file." });
    }
});

app.post("/api/convert-pdf", async (req, res) => {
    const data = requestData(req, res);
    if (!data) return;
    if (process.platform !== "win32") return res.status(501).json({ error: "PDF conversion currently requires Windows and Microsoft Word." });
    const jobDir = path.join(os.tmpdir(), `md2docx-${randomUUID()}`);
    const docxPath = path.join(jobDir, "source.docx");
    const pdfPath = path.join(jobDir, "result.pdf");
    try {
        await fs.mkdir(jobDir, { recursive: true });
        await fs.writeFile(docxPath, await markdownToDocx(data.markdown, { title: data.filename }));
        await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", pdfScript, "-InputPath", docxPath, "-OutputPath", pdfPath], { windowsHide: true, timeout: 120_000 });
        const pdf = await fs.readFile(pdfPath);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${data.filename}.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not create the PDF. Make sure Microsoft Word is installed and not showing a dialog." });
    } finally {
        await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`md2docx is ready at http://localhost:${port}`));