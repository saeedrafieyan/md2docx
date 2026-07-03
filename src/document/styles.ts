import type { IStylesOptions } from "docx";
import type { DocumentTheme } from "./themes.js";
import { pointsToHalfPoints } from "./measurements.js";
export function documentStyles(theme: DocumentTheme): IStylesOptions {
  return {
    default: {
      document: {
        run: {
          font: theme.body.font,
          size: pointsToHalfPoints(theme.body.size),
          color: theme.body.color,
        },
        paragraph: {
          spacing: {
            after: theme.body.paragraphAfter * 20,
            line: Math.round(theme.body.lineSpacing * 240),
          },
        },
      },
    },
    paragraphStyles: Object.values(theme.headings).map((value, index) => ({
      id: `Heading${index + 1}`,
      name: `Heading ${index + 1}`,
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: {
        font: value.font,
        size: pointsToHalfPoints(value.size),
        bold: value.bold,
        color: value.color,
      },
      paragraph: {
        spacing: { before: value.before * 20, after: value.after * 20 },
        outlineLevel: index,
      },
    })),
  };
}
