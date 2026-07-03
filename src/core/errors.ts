export class MarkdownConversionError extends Error {
  constructor(
    message: string,
    readonly code = "MARKDOWN_CONVERSION_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class MathConversionError extends MarkdownConversionError {
  constructor(
    message: string,
    readonly source?: string,
  ) {
    super(message, "MATH_CONVERSION_ERROR");
  }
}
export class ImageResolutionError extends MarkdownConversionError {
  constructor(
    message: string,
    readonly source?: string,
  ) {
    super(message, "IMAGE_RESOLUTION_ERROR");
  }
}
export class InvalidConfigurationError extends MarkdownConversionError {
  constructor(message: string) {
    super(message, "INVALID_CONFIGURATION");
  }
}
