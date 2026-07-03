import fs from "node:fs/promises";
import path from "node:path";
import { addWarning } from "../core/warnings.js";
import type { ConversionContext } from "../core/types.js";
import type { ResolvedAsset, SupportedImageMime } from "./image-types.js";
const ALLOWED = new Set<SupportedImageMime>([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
]);
function mimeFromBytes(data: Uint8Array, declared?: string): SupportedImageMime | null {
  if (data[0] === 0x89 && data[1] === 0x50) return "image/png";
  if (data[0] === 0xff && data[1] === 0xd8) return "image/jpeg";
  if (String.fromCharCode(...data.slice(0, 6)).startsWith("GIF8")) return "image/gif";
  const head = new TextDecoder().decode(data.slice(0, 256)).trimStart();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg")))
    return "image/svg+xml";
  const clean = declared?.split(";")[0]?.toLowerCase() as SupportedImageMime | undefined;
  return clean && ALLOWED.has(clean) ? clean : null;
}
function warn(context: ConversionContext, code: string, message: string, source: string): null {
  addWarning(context, { code, message, source });
  return null;
}
async function readRemote(
  source: string,
  context: ConversionContext,
): Promise<{ data: Uint8Array; declared?: string } | null> {
  if (!context.options.allowRemoteImages)
    return warn(context, "REMOTE_IMAGE_DISABLED", "Remote image loading is disabled.", source);
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), context.options.remoteImageTimeoutMs);
  try {
    const response = await fetch(source, { signal: controller.signal, redirect: "follow" });
    if (!response.ok)
      return warn(
        context,
        "IMAGE_FETCH_FAILED",
        `Remote image returned HTTP ${response.status}.`,
        source,
      );
    const declared = response.headers.get("content-type") ?? undefined;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > context.options.maxRemoteImageBytes)
      return warn(
        context,
        "IMAGE_TOO_LARGE",
        "Remote image exceeds the configured size limit.",
        source,
      );
    const reader = response.body?.getReader();
    if (!reader)
      return warn(context, "IMAGE_FETCH_FAILED", "Remote image response had no body.", source);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.length;
      if (total > context.options.maxRemoteImageBytes) {
        controller.abort();
        return warn(
          context,
          "IMAGE_TOO_LARGE",
          "Remote image exceeds the configured size limit.",
          source,
        );
      }
      chunks.push(part.value);
    }
    const data = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return { data, ...(declared ? { declared } : {}) };
  } catch (error) {
    return warn(
      context,
      "IMAGE_FETCH_FAILED",
      error instanceof Error ? error.message : "Remote image could not be loaded.",
      source,
    );
  } finally {
    clearTimeout(timer);
  }
}
export async function resolveImage(
  source: string,
  alt: string | undefined,
  title: string | undefined,
  context: ConversionContext,
): Promise<ResolvedAsset | null> {
  const resolution = {
    ...(context.options.imageBasePath ? { basePath: context.options.imageBasePath } : {}),
    allowRemote: context.options.allowRemoteImages,
    timeoutMs: context.options.remoteImageTimeoutMs,
    maxBytes: context.options.maxRemoteImageBytes,
  };
  if (context.options.assetResolver) {
    const custom = await context.options.assetResolver(source, resolution);
    if (custom) return { ...custom, ...(alt ? { alt } : {}), ...(title ? { title } : {}) };
  }
  let data: Uint8Array, declared: string | undefined;
  if (source.startsWith("data:")) {
    const match = source.match(/^data:([^;,]+);base64,(.+)$/s);
    if (!match)
      return warn(context, "INVALID_DATA_URL", "Image data URL must be base64 encoded.", source);
    data = Uint8Array.from(Buffer.from(match[2] ?? "", "base64"));
    declared = match[1];
  } else if (/^https?:\/\//i.test(source)) {
    const remote = await readRemote(source, context);
    if (!remote) return null;
    data = remote.data;
    declared = remote.declared;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(source) && !path.isAbsolute(source)) {
    return warn(
      context,
      "UNSAFE_IMAGE_PROTOCOL",
      "Only data, HTTP, HTTPS, and local paths are supported.",
      source,
    );
  } else {
    const file = path.isAbsolute(source)
      ? source
      : context.options.imageBasePath
        ? path.resolve(context.options.imageBasePath, source)
        : null;
    if (!file)
      return warn(
        context,
        "IMAGE_BASE_PATH_REQUIRED",
        "Relative images require imageBasePath or an asset resolver.",
        source,
      );
    try {
      data = new Uint8Array(await fs.readFile(file));
    } catch {
      return warn(context, "IMAGE_NOT_FOUND", "Local image could not be read.", source);
    }
  }
  if (data.length > context.options.maxRemoteImageBytes)
    return warn(context, "IMAGE_TOO_LARGE", "Image exceeds the configured size limit.", source);
  const mimeType = mimeFromBytes(data, declared);
  if (!mimeType)
    return warn(
      context,
      "UNSUPPORTED_IMAGE_TYPE",
      "Only PNG, JPEG, GIF, and SVG images are supported.",
      source,
    );
  return { data, mimeType, source, ...(alt ? { alt } : {}), ...(title ? { title } : {}) };
}
