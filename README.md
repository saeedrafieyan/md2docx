# md2docx

`md2docx` is a local Markdown-to-Word converter that creates editable `.docx` files. It preserves document structure instead of flattening content into screenshots or plain text.

## Features

- Headings, paragraphs, bold, italics, links, block quotes, and horizontal rules
- Ordered, unordered, and nested lists
- Code blocks and inline code
- GitHub-flavored Markdown tables
- Native editable Word equations, including fractions, integrals, subscripts, superscripts, Greek symbols, and boxed formulas
- Display equations written as `$$ ... $$` or standalone `[ ... ]` blocks
- Inline equations such as `(x=t/T)`, `(\alpha)`, and units such as `min(^{-1})`
- Local processing: submitted text stays on your computer

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- npm (included with Node.js)

## Run the browser app

1. Clone this repository and enter its directory:

   ```bash
   git clone https://github.com/saeedrafieyan/md2docx.git
   cd md2docx
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000), paste Markdown or select a Markdown file, then click **Convert to Word** or **Convert to PDF**.

Keep the terminal open while using the browser app. Stop the server with `Ctrl+C`.

PDF export currently requires Windows with Microsoft Word installed. The conversion runs locally through Word's PDF exporter, so Word and PDF outputs share the same formatting and native equations.

## Command-line usage

Convert a Markdown file next to the source file:

```bash
npm run convert -- notes.md
```

Choose the output path:

```bash
npm run convert -- notes.md -o report.docx
```

## Equation examples

Standard display math:

```text
$$E_{foam}(z)=\frac{1}{H}\int_0^H \frac{dz}{E_{foam}(z)}$$
```

Bracket-style display math, commonly returned by AI chat tools:

```text
[
\boxed{k=0.4650543\ \text{min}^{-1}}
]
```

The generated equations are native Word math objects and remain editable in Microsoft Word.

## Tests

```bash
npm test
```

## License

MIT