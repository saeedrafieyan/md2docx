import type { ConversionWarning, UnsupportedMathStrategy } from "../core/types.js";
import type { MathNode } from "./math-types.js";
export interface MathParseResult {
  ast: MathNode[] | null;
  warnings: ConversionWarning[];
  source: string;
}
export interface MathParseOptions {
  unsupportedMathStrategy: UnsupportedMathStrategy;
}
