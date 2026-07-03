import { imageSize } from "image-size";
import type { ResolvedAsset } from "./image-types.js";
export function imageDimensions(
  asset: ResolvedAsset,
  maxWidth: number,
): { width: number; height: number } {
  let width = asset.width,
    height = asset.height;
  if (!width || !height) {
    const measured = imageSize(asset.data);
    width = measured.width;
    height = measured.height;
  }
  if (!width || !height) throw new Error("Image dimensions could not be determined.");
  const scale = Math.min(1, maxWidth / width);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
