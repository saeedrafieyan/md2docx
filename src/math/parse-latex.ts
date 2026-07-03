import { MathConversionError } from "../core/errors.js";
import type { ConversionWarning } from "../core/types.js";
import type { MathParseOptions, MathParseResult } from "./math-result.js";
import type { MathNode } from "./math-types.js";
import { FUNCTIONS, SYMBOLS } from "./supported-commands.js";

class UnsupportedSyntax extends Error {
  constructor(readonly command: string) {
    super(`Unsupported LaTeX command \\${command}`);
  }
}
class Parser {
  private index = 0;
  constructor(private readonly source: string) {}
  parse(): MathNode[] {
    const nodes = this.sequence();
    if (this.index !== this.source.length) throw new UnsupportedSyntax("malformed-expression");
    return nodes;
  }
  private sequence(stop?: string): MathNode[] {
    const nodes: MathNode[] = [];
    while (this.index < this.source.length && this.source[this.index] !== stop) {
      if (/\s/.test(this.source[this.index] ?? "")) {
        this.index++;
        const last = nodes.at(-1);
        if (last?.type !== "text" || last.value !== " ") nodes.push({ type: "text", value: " " });
        continue;
      }
      let base = this.atom();
      const scripts = this.scripts();
      if (scripts.subscript || scripts.superscript) base = [{ type: "script", base, ...scripts }];
      nodes.push(...base);
    }
    if (stop) {
      if (this.source[this.index] !== stop) throw new UnsupportedSyntax("unclosed-group");
      this.index++;
    }
    return nodes;
  }
  private atom(): MathNode[] {
    const char = this.source[this.index];
    if (char === "{") {
      this.index++;
      return this.sequence("}");
    }
    if (char === "(") {
      this.index++;
      return [{ type: "group", kind: "round", body: this.sequence(")") }];
    }
    if (char === "[") {
      this.index++;
      return [{ type: "group", kind: "square", body: this.sequence("]") }];
    }
    if (char === "\\") return this.command();
    if (char === "}" || char === ")" || char === "]")
      throw new UnsupportedSyntax("unexpected-delimiter");
    if (char === undefined) return [];
    this.index++;
    return [{ type: "text", value: char }];
  }
  private group(): MathNode[] {
    if (this.source[this.index] !== "{") throw new UnsupportedSyntax("expected-group");
    this.index++;
    return this.sequence("}");
  }
  private optionalSquare(): MathNode[] | undefined {
    if (this.source[this.index] !== "[") return undefined;
    this.index++;
    return this.sequence("]");
  }
  private scripts(): { subscript?: MathNode[]; superscript?: MathNode[] } {
    let subscript: MathNode[] | undefined, superscript: MathNode[] | undefined;
    while (this.source[this.index] === "_" || this.source[this.index] === "^") {
      const op = this.source[this.index++];
      const value = this.source[this.index] === "{" ? this.group() : this.atom();
      if (op === "_") subscript = value;
      else superscript = value;
    }
    return { ...(subscript ? { subscript } : {}), ...(superscript ? { superscript } : {}) };
  }
  private command(): MathNode[] {
    this.index++;
    const letters = this.source.slice(this.index).match(/^[A-Za-z]+/)?.[0] ?? "";
    if (!letters) {
      const escaped = this.source[this.index++] ?? "";
      return [{ type: "text", value: SYMBOLS[escaped] ?? escaped }];
    }
    this.index += letters.length;
    if (letters === "left" || letters === "right") return [];
    if (letters === "frac" || letters === "dfrac" || letters === "tfrac")
      return [{ type: "fraction", numerator: this.group(), denominator: this.group() }];
    if (letters === "sqrt") {
      const degree = this.optionalSquare(),
        body = this.group();
      return [{ type: "radical", body, ...(degree ? { degree } : {}) }];
    }
    if (letters === "text" || letters === "mathrm" || letters === "operatorname")
      return this.group();
    if (letters === "boxed") return [{ type: "boxed", body: this.group() }];
    if (letters === "sum" || letters === "prod" || letters === "int") {
      const scripts = this.scripts();
      return [
        {
          type: "nary",
          operator: letters === "prod" ? "product" : letters === "int" ? "integral" : "sum",
          body: [],
          ...(scripts.subscript ? { lower: scripts.subscript } : {}),
          ...(scripts.superscript ? { upper: scripts.superscript } : {}),
        },
      ];
    }
    if (letters === "lim") {
      const scripts = this.scripts();
      return [
        { type: "limit", body: [{ type: "text", value: "lim" }], limit: scripts.subscript ?? [] },
      ];
    }
    const symbol = SYMBOLS[letters];
    if (symbol !== undefined) return [{ type: "text", value: symbol }];
    if (FUNCTIONS.has(letters)) return [{ type: "function", name: letters, body: [] }];
    if (letters === "begin" || letters === "end") throw new UnsupportedSyntax("matrix-environment");
    throw new UnsupportedSyntax(letters);
  }
}
function attachNaryBodies(nodes: MathNode[]): MathNode[] {
  const result: MathNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if ((node?.type === "nary" || node?.type === "function") && node.body.length === 0) {
      const next = nodes[i + 1];
      if (next) {
        node.body = [next];
        i++;
      }
    }
    result.push(node as MathNode);
  }
  return result;
}
export function parseLatex(source: string, options: MathParseOptions): MathParseResult {
  try {
    return { ast: attachNaryBodies(new Parser(source).parse()), warnings: [], source };
  } catch (error) {
    const command = error instanceof UnsupportedSyntax ? error.command : "invalid-syntax";
    const warning: ConversionWarning = {
      code: "UNSUPPORTED_MATH_COMMAND",
      message: `The command or construct \\${command} is not currently supported.`,
      source,
    };
    if (options.unsupportedMathStrategy === "error")
      throw new MathConversionError(warning.message, source);
    return { ast: null, warnings: [warning], source };
  }
}
