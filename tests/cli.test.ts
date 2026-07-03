import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
const execute = promisify(execFile),
  tsx = path.resolve("node_modules/tsx/dist/cli.mjs"),
  created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((file) => fs.rm(file, { force: true })));
});
async function run(args: string[]) {
  return execute(process.execPath, [tsx, "src/cli/index.ts", ...args], { cwd: process.cwd() });
}
describe("CLI", () => {
  it("supports default and explicit output paths", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "md2docx-cli-")),
      input = path.join(dir, "notes.md"),
      explicit = path.join(dir, "report.docx");
    created.push(input, path.join(dir, "notes.docx"), explicit);
    await fs.writeFile(input, "# CLI");
    expect((await run([input])).stdout).toContain("notes.docx");
    expect((await fs.readFile(path.join(dir, "notes.docx"))).subarray(0, 2).toString()).toBe("PK");
    await run([
      input,
      "-o",
      explicit,
      "--page-size",
      "a4",
      "--theme",
      "academic",
      "--title",
      "Report",
      "--author",
      "Author",
    ]);
    expect((await fs.readFile(explicit)).subarray(0, 2).toString()).toBe("PK");
  });
  it("prints warnings to stderr", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "md2docx-cli-")),
      input = path.join(dir, "warn.md"),
      output = path.join(dir, "warn.docx");
    created.push(input, output);
    await fs.writeFile(input, "$$\\overset{x}{y}$$");
    expect((await run([input, "-o", output])).stderr).toContain("UNSUPPORTED_MATH_COMMAND");
  });
  const invalidInvocations: string[][] = [
    ["missing.md"],
    ["sample.md", "--page-size", "legal"],
    ["sample.md", "--theme", "neon"],
    ["sample.md", "--unknown"],
  ];
  it.each(invalidInvocations)("fails for invalid invocation %j", async (...args) => {
    await expect(run(args)).rejects.toMatchObject({ code: expect.any(Number) });
  });
});
