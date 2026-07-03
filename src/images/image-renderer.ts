import { ImageRun } from "docx";
import type { ConversionContext } from "../core/types.js";
import { imageDimensions } from "./image-dimensions.js";
import type { ResolvedAsset } from "./image-types.js";
const FALLBACK = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
    "base64",
  ),
);
export function renderImage(asset: ResolvedAsset, context: ConversionContext): ImageRun {
  const transformation = imageDimensions(asset, context.contentWidthPixels),
    altText = {
      title: asset.title ?? asset.alt ?? "Image",
      description: asset.alt ?? "",
      name: asset.alt ?? "Image",
    };
  if (asset.mimeType === "image/svg+xml")
    return new ImageRun({
      type: "svg",
      data: asset.data,
      fallback: { type: "png", data: FALLBACK },
      transformation,
      altText,
    });
  const type =
    asset.mimeType === "image/jpeg" ? "jpg" : asset.mimeType === "image/gif" ? "gif" : "png";
  return new ImageRun({ type, data: asset.data, transformation, altText });
}
