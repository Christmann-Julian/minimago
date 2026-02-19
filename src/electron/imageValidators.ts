import { ImageProcessOptions, ALLOWED_FORMATS } from './imageTypes.js';

export function isAllowedFormat(
  v: unknown,
): v is ImageProcessOptions['format'] {
  return (
    typeof v === 'string' && (ALLOWED_FORMATS as readonly string[]).includes(v)
  );
}

/**
 * Validate and normalize the shape of the input options object.
 */
export function normalizeAndCheckShape(obj: unknown): ImageProcessOptions {
  if (typeof obj !== 'object' || obj === null)
    throw new Error('Invalid options');

  const o = obj as Record<string, unknown>;

  if (typeof o.inputPath !== 'string' || o.inputPath.trim() === '') {
    throw new Error('Invalid inputPath');
  }

  let crop: ImageProcessOptions['crop'] | undefined = undefined;
  if (o.crop && typeof o.crop === 'object') {
    const c = o.crop as Record<string, unknown>;
    if (
      typeof c.x === 'number' &&
      Number.isInteger(c.x) &&
      c.x >= 0 &&
      typeof c.y === 'number' &&
      Number.isInteger(c.y) &&
      c.y >= 0 &&
      typeof c.width === 'number' &&
      Number.isInteger(c.width) &&
      c.width > 0 &&
      typeof c.height === 'number' &&
      Number.isInteger(c.height) &&
      c.height > 0
    ) {
      crop = { x: c.x, y: c.y, width: c.width, height: c.height };
    }
  }

  const format =
    typeof o.format === 'string'
      ? (o.format.toLowerCase() as ImageProcessOptions['format'])
      : undefined;

  if (format && !isAllowedFormat(format))
    throw new Error('Invalid target format');

  const width = o.width === undefined ? undefined : Number(o.width);
  const height = o.height === undefined ? undefined : Number(o.height);
  const quality = o.quality === undefined ? undefined : Number(o.quality);
  const outputPath =
    typeof o.outputPath === 'string' && o.outputPath.trim() !== ''
      ? o.outputPath
      : undefined;

  if (
    width !== undefined &&
    (!Number.isFinite(width) || width <= 0 || width > 20000)
  )
    throw new Error('width out of range');
  if (
    height !== undefined &&
    (!Number.isFinite(height) || height <= 0 || height > 20000)
  )
    throw new Error('height out of range');

  const q = Number.isFinite(Number(quality)) ? Math.round(Number(quality)) : 80;
  const clampQuality = Math.max(1, Math.min(100, q));

  const removeBg = o.removeBg === true;
  const bgColor = typeof o.bgColor === 'string' ? o.bgColor : undefined;
  const bgTolerance =
    typeof o.bgTolerance === 'number' ? o.bgTolerance : undefined;

  return {
    inputPath: o.inputPath,
    crop,
    width: width === undefined ? undefined : Math.round(width),
    height: height === undefined ? undefined : Math.round(height),
    format,
    quality: clampQuality,
    outputPath,
    removeBg,
    bgColor,
    bgTolerance,
  };
}
