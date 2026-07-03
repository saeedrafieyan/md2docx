import {
  Math as WordMath,
  MathCurlyBrackets,
  MathFraction,
  MathFunction,
  MathIntegral,
  MathLimitLower,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
  type MathComponent,
} from "docx";
import type { MathNode } from "./math-types.js";
function renderNode(node: MathNode): MathComponent[] {
  switch (node.type) {
    case "text":
      return [new MathRun(node.value)];
    case "fraction":
      return [
        new MathFraction({
          numerator: renderMath(node.numerator),
          denominator: renderMath(node.denominator),
        }),
      ];
    case "script": {
      const children = renderMath(node.base);
      if (node.subscript && node.superscript)
        return [
          new MathSubSuperScript({
            children,
            subScript: renderMath(node.subscript),
            superScript: renderMath(node.superscript),
          }),
        ];
      if (node.subscript)
        return [new MathSubScript({ children, subScript: renderMath(node.subscript) })];
      return [new MathSuperScript({ children, superScript: renderMath(node.superscript ?? []) })];
    }
    case "radical":
      return [
        new MathRadical({
          children: renderMath(node.body),
          ...(node.degree ? { degree: renderMath(node.degree) } : {}),
        }),
      ];
    case "group": {
      const options = { children: renderMath(node.body) };
      return [
        node.kind === "round"
          ? new MathRoundBrackets(options)
          : node.kind === "square"
            ? new MathSquareBrackets(options)
            : new MathCurlyBrackets(options),
      ];
    }
    case "function":
      return [
        new MathFunction({ name: [new MathRun(node.name)], children: renderMath(node.body) }),
      ];
    case "limit":
      return [
        new MathLimitLower({ children: renderMath(node.body), limit: renderMath(node.limit) }),
      ];
    case "boxed":
      return renderMath(node.body);
    case "nary": {
      const lower = node.lower ? renderMath(node.lower) : undefined,
        upper = node.upper ? renderMath(node.upper) : undefined,
        children = renderMath(node.body);
      if (node.operator === "integral")
        return [
          new MathIntegral({
            children,
            ...(lower ? { subScript: lower } : {}),
            ...(upper ? { superScript: upper } : {}),
          }),
        ];
      if (node.operator === "sum")
        return [
          new MathSum({
            children,
            ...(lower ? { subScript: lower } : {}),
            ...(upper ? { superScript: upper } : {}),
          }),
        ];
      let base: MathComponent[] = [new MathRun("∏")];
      if (lower && upper)
        base = [new MathSubSuperScript({ children: base, subScript: lower, superScript: upper })];
      else if (lower) base = [new MathSubScript({ children: base, subScript: lower })];
      else if (upper) base = [new MathSuperScript({ children: base, superScript: upper })];
      return [...base, ...children];
    }
  }
}
export function renderMath(nodes: MathNode[]): MathComponent[] {
  return nodes.flatMap(renderNode);
}
export function renderEquation(nodes: MathNode[]): WordMath {
  return new WordMath({ children: renderMath(nodes) });
}
