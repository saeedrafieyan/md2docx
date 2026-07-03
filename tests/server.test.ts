import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/server/app.js";
describe("HTTP API", () => {
  const app = createApp();
  it("serves browser controls", async () => {
    const response = await request(app).get("/").expect(200);
    expect(response.text).toContain('id="title"');
    expect(response.text).toContain('id="page-size"');
    expect(response.text).toContain('id="theme"');
    expect(response.text).toContain('id="convert"');
  });
  it("returns a DOCX with backward-compatible headers", async () => {
    const response = await request(app)
      .post("/api/convert")
      .send({
        markdown: "# Hello",
        filename: " report / unsafe.md ",
        title: "Title",
        pageSize: "a4",
        theme: "minimal",
      })
      .expect(200);
    expect(response.headers["content-type"]).toContain("wordprocessingml");
    expect(response.headers["content-disposition"]).toContain("report-unsafe.docx");
    expect(response.headers["x-md2docx-warning-count"]).toBe("0");
  });
  it("exposes compact warning metadata", async () => {
    const response = await request(app)
      .post("/api/convert")
      .send({ markdown: "$$\\overset{x}{y}$$" })
      .expect(200);
    expect(response.headers["x-md2docx-warning-count"]).toBe("1");
    const warnings = JSON.parse(
      Buffer.from(String(response.headers["x-md2docx-warnings"]), "base64url").toString(),
    ) as { code: string }[];
    expect(warnings[0]?.code).toBe("UNSUPPORTED_MATH_COMMAND");
  });
  it("rejects empty Markdown", async () => {
    const response = await request(app).post("/api/convert").send({ markdown: " " }).expect(400);
    expect((response.body as { error: string }).error).toMatch(/Markdown/);
  });
  it("returns JSON for invalid JSON", async () => {
    const response = await request(app)
      .post("/api/convert")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);
    expect((response.body as { error: string }).error).toMatch(/Invalid JSON/);
  });
  it("rejects oversized requests", async () => {
    const response = await request(app)
      .post("/api/convert")
      .send({ markdown: "x".repeat(10 * 1024 * 1024 + 1) })
      .expect(413);
    expect((response.body as { error: string }).error).toMatch(/large/);
  });
});
