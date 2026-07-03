export type SupportedImageMime = "image/png" | "image/jpeg" | "image/gif" | "image/svg+xml";
export interface AssetResolutionContext {
  basePath?: string;
  allowRemote: boolean;
  timeoutMs: number;
  maxBytes: number;
}
export interface ResolvedAsset {
  data: Uint8Array;
  mimeType: SupportedImageMime;
  width?: number;
  height?: number;
  source: string;
  alt?: string;
  title?: string;
}
export type AssetResolver = (
  source: string,
  context: AssetResolutionContext,
) => Promise<ResolvedAsset | null>;
