# md2docx

`md2docx` converts Markdown into structured, editable Microsoft Word documents. It preserves document semantics, emits supported equations as native OMML Word math, embeds images, and reports anything it cannot convert safely. Conversion runs locally.

## Features

- Browser application and command-line interface
- Native DOCX headings, paragraphs, emphasis, links, lists, quotes, code, tables, and rules
- Native editable Word equations for a documented LaTeX subset
- Embedded local, data-URL, and opt-in remote images
- Letter and A4 pages, portrait or landscape through the API
- Built-in `default`, `academic`, and `minimal` themes
- Structured warnings and conversion statistics
- Optional Windows/Microsoft Word PDF export
- Strict TypeScript and a DOCX package/XML regression suite

## Requirements

- Node.js 18 or newer
- npm
- Optional: Windows with Microsoft Word for the **Convert to PDF** browser action

No Pandoc, Python, Java, or LibreOffice runtime is required.

## Install and run the browser app

```bash
git clone https://github.com/saeedrafieyan/md2docx.git
cd md2docx
npm install
npm start
```

Open <http://localhost:3000>. You can select or drag a Markdown file, paste Markdown, choose a title/page size/theme, and download DOCX. On Windows with Word installed, you can also download PDF.

Keep the terminal open while using the app. Stop it with `Ctrl+C`.

## Command line

Existing simple usage remains supported:

```bash
npm run convert -- notes.md
npm run convert -- notes.md -o report.docx
```

Options:

```bash
npm run convert -- notes.md \
  --output report.docx \
  --page-size a4 \
  --theme academic \
  --title "Research Report" \
  --author "Author Name"
```

Use `--math-errors` to stop instead of preserving unsupported equations. Relative image paths are resolved from the Markdown file's directory. Recoverable warnings are printed to stderr.

## Supported Markdown

Fully supported:

- headings 1–6
- paragraphs, bold, italics, strikethrough, and line breaks
- inline and fenced code
- block quotes
- ordered, unordered, mixed, and nested lists
- links
- GitHub-flavored tables
- horizontal rules
- Unicode, including Polish and right-to-left text content
- inline and display equations
- Markdown images described below

Raw HTML is not interpreted as a browser DOM. Unknown Markdown tokens are preserved as visible text where practical.

## Equation syntax

Display math can use standard delimiters:

```text
$$\frac{a}{b}$$
```

AI-chat bracket blocks are normalized too:

```text
[
\boxed{k=0.465\ \mathrm{min}^{-1}}
]
```

Inline math accepts `$...$`, `\(...\)`, and the project's compatibility notation such as `(x=t/T)`, `(\alpha)`, and `min(^{-1})`.

### Fully supported equation constructs

- variables, numbers, whitespace, and ordinary punctuation
- Greek letters and common relation/operator symbols
- `\frac`, `\dfrac`, and nested fractions
- `_` subscripts, `^` superscripts, and simultaneous sub/superscripts
- `\sum`, `\prod`, and `\int` with limits
- `\sqrt{x}` and `\sqrt[n]{x}`
- `\lim`, common named functions (`\sin`, `\cos`, `\exp`, `\ln`, and others)
- parentheses, square brackets, and visible braces
- `\text`, `\mathrm`, and `\operatorname` content
- `\boxed` for display equations

### Partially supported

- `\boxed` is represented using a fitted paragraph border because the `docx` library does not expose a native OMML box component.
- GIF files are embedded; Word-compatible software determines animation/first-frame behavior.
- SVG is embedded natively with a transparent PNG compatibility fallback.

### Unsupported

Matrices/environments, accents, `\overset`, `\underset`, macros, equation numbering, alignment environments, and arbitrary LaTeX packages are not converted.

Unsupported or malformed equations are never silently approximated. The default `warn-and-preserve` strategy writes `[Unconverted equation: ...]` visibly and returns an `UNSUPPORTED_MATH_COMMAND` warning. The `error` strategy throws `MathConversionError`.

## Images

Supported formats: PNG, JPEG, GIF, and SVG.

Sources:

- relative local paths when `imageBasePath` is available (automatic in the CLI)
- absolute local paths in the Node API
- base64 data URLs
- HTTP/HTTPS only when `allowRemoteImages: true`
- a custom `AssetResolver` callback for application-supplied assets

Images preserve aspect ratio and scale down to page width. Alt text and optional titles are written to DOCX drawing properties.

Browser-pasted Markdown cannot read arbitrary relative filesystem paths. Such images are replaced with a visible warning marker and an `IMAGE_BASE_PATH_REQUIRED` warning. A future ZIP/directory uploader can provide assets through `assetResolver` without changing the core converter.

Remote images are disabled by default. When enabled, the resolver enforces HTTP(S), timeout, maximum bytes, allowed MIME types, and response status. `file://`, `javascript:`, and other schemes are rejected.

## Themes and page layout

Built-in themes:

- `default`: Calibri and blue headings
- `academic`: Times New Roman and restrained grayscale styling
- `minimal`: Aptos with light borders and compact spacing

Themes control body and heading fonts/sizes/colors, line and paragraph spacing, code styling, quote borders/indentation, tables, links, math borders, and horizontal rules. `DocumentTheme` can be partially overridden through the API.

Letter remains the default. A4 is first-class, and the API also supports landscape orientation and custom margins in inches.

## TypeScript API

```ts
import { convertMarkdownToBuffer } from "md2docx";

const result = await convertMarkdownToBuffer(markdown, {
  title: "Research Report",
  author: "Author Name",
  pageSize: "a4",
  theme: "academic",
  imageBasePath: process.cwd(),
  allowRemoteImages: false,
  unsupportedMathStrategy: "warn-and-preserve",
});

await fs.writeFile("report.docx", result.output);
console.log(result.warnings, result.statistics);
```

Public APIs:

- `buildMarkdownDocument()` – native `docx.Document`
- `convertMarkdownToBuffer()` – Node `Buffer`
- `convertMarkdownToBlob()` – browser-compatible `Blob`
- `markdownToDocx()` – backward-compatible buffer helper

Core conversion has no dependency on Express, Commander, or browser DOM APIs.

## Warnings and HTTP behavior

`/api/convert` remains a binary DOCX download endpoint. It adds:

- `X-MD2DOCX-Warning-Count`
- `X-MD2DOCX-Warnings` containing small warning arrays encoded as base64url JSON

The browser decodes and displays these warnings. Large warning collections retain the count and remain visible in the generated document. Fatal request errors use JSON responses.

## Privacy

Markdown and local images are processed on your machine. The application does not upload documents. Network access occurs only when an API caller explicitly enables remote images and the Markdown references an HTTP(S) image.

## Development

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run check
```

`npm run check` validates formatting, linting, strict TypeScript, tests, and the production build. Coverage thresholds are 85% statements, 75% branches, 85% functions, and 85% lines.

## Architecture

- `src/core` – public conversion contracts, errors, warnings, statistics
- `src/markdown` – normalization, tokenization, block and inline orchestration
- `src/math` – validated LaTeX AST and AST-to-OMML rendering
- `src/images` – secure resolution, MIME/dimension validation, rendering
- `src/renderers` – focused Word block renderers
- `src/document` – themes, measurements, page layout, numbering, construction
- `src/cli` – Commander adapter
- `src/server` – Express adapter and compatibility endpoints

## Known limitations

- This is a documented LaTeX subset, not a TeX engine.
- Relative browser images require an application-provided asset resolver; selecting one Markdown file does not grant directory access.
- Remote image loading is Node-only and opt-in.
- PDF export is optional and currently uses Microsoft Word automation on Windows.
- SVG appearance depends on the Word-compatible viewer; a fallback is included.

## License

MIT
