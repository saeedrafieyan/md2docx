import type { DocumentTheme, ThemeName } from "../document/themes.js";
import type { AssetResolver } from "../images/image-types.js";

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export type UnsupportedMathStrategy = "warn-and-preserve" | "error";
export interface ConversionOptions {
  title?: string;
  author?: string;
  description?: string;
  pageSize?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
  margins?: Partial<PageMargins>;
  theme?: ThemeName | Partial<DocumentTheme>;
  imageBasePath?: string;
  allowRemoteImages?: boolean;
  assetResolver?: AssetResolver;
  unsupportedMathStrategy?: UnsupportedMathStrategy;
  remoteImageTimeoutMs?: number;
  maxRemoteImageBytes?: number;
}
export interface ConversionWarning {
  code: string;
  message: string;
  source?: string;
  line?: number;
  column?: number;
}
export interface ConversionStatistics {
  headings: number;
  paragraphs: number;
  lists: number;
  tables: number;
  codeBlocks: number;
  equations: number;
  images: number;
  warnings: number;
}
export interface ConversionResult<T> {
  output: T;
  warnings: ConversionWarning[];
  statistics: ConversionStatistics;
}
export interface ConversionContext {
  options: Required<
    Pick<
      ConversionOptions,
      | "pageSize"
      | "orientation"
      | "allowRemoteImages"
      | "unsupportedMathStrategy"
      | "remoteImageTimeoutMs"
      | "maxRemoteImageBytes"
    >
  > &
    ConversionOptions;
  theme: DocumentTheme;
  warnings: ConversionWarning[];
  statistics: ConversionStatistics;
  contentWidthPixels: number;
}
