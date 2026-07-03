export type MathNode =
  | { type: "text"; value: string }
  | { type: "fraction"; numerator: MathNode[]; denominator: MathNode[] }
  | { type: "script"; base: MathNode[]; subscript?: MathNode[]; superscript?: MathNode[] }
  | {
      type: "nary";
      operator: "sum" | "product" | "integral";
      body: MathNode[];
      lower?: MathNode[];
      upper?: MathNode[];
    }
  | { type: "radical"; body: MathNode[]; degree?: MathNode[] }
  | { type: "group"; kind: "round" | "square" | "brace"; body: MathNode[] }
  | { type: "function"; name: string; body: MathNode[] }
  | { type: "limit"; body: MathNode[]; limit: MathNode[] }
  | { type: "boxed"; body: MathNode[] };
