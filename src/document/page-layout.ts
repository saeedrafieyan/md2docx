import { centimetersToTwips, inchesToTwips } from "./measurements.js";
import type { ConversionOptions, PageMargins } from "../core/types.js";
export const PAGE_SIZES = {
  letter: { width: inchesToTwips(8.5), height: inchesToTwips(11) },
  a4: { width: centimetersToTwips(21), height: centimetersToTwips(29.7) },
} as const;
export function pageLayout(options: ConversionOptions) {
  const page = PAGE_SIZES[options.pageSize ?? "letter"];
  const landscape = options.orientation === "landscape";
  const defaults: PageMargins = { top: 1, right: 1, bottom: 1, left: 1 };
  const margins = { ...defaults, ...options.margins };
  return {
    width: landscape ? page.height : page.width,
    height: landscape ? page.width : page.height,
    margins: {
      top: inchesToTwips(margins.top),
      right: inchesToTwips(margins.right),
      bottom: inchesToTwips(margins.bottom),
      left: inchesToTwips(margins.left),
    },
    contentWidth: twipsContent(landscape ? page.height : page.width, margins),
  };
}
function twipsContent(width: number, margins: PageMargins) {
  return width - inchesToTwips(margins.left + margins.right);
}
