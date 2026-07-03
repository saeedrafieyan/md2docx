#!/usr/bin/env node
import { createCli } from "./program.js";
createCli()
  .parseAsync()
  .catch((error: unknown) => {
    console.error(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
