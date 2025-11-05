import path from 'path';
import sharp from 'sharp';
import fsPromises from 'fs/promises';
import { app } from 'electron';

export type ImageProcessOptions = {
  inputPath: string;
  width?: number;
  height?: number;
  format?: 'png'|'jpg'|'jpeg'|'webp'|'svg'|'avif';
  quality?: number;
  outputPath?: string;
};

const ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'svg'] as const;
const MAX_PIXELS = 100_000_000; // 100M pixels
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

function isAllowedFormat(v: unknown): v is ImageProcessOptions['format'] {
  return typeof v === 'string' && (ALLOWED_FORMATS as readonly string[]).includes(v);
}

function normalizeAndCheckShape(obj: unknown): ImageProcessOptions {
  if (typeof obj !== 'object' || obj === null) throw new Error('Invalid options');
  const o = obj as Record<string, unknown>;
  if (typeof o.inputPath !== 'string' || o.inputPath.trim() === '') throw new Error('Invalid inputPath');

  const format = typeof o.format === 'string' ? (o.format.toLowerCase() as ImageProcessOptions['format']) : undefined;
  if (format && !isAllowedFormat(format)) throw new Error('Invalid target format');

  const width = o.width === undefined ? undefined : Number(o.width);
  const height = o.height === undefined ? undefined : Number(o.height);
  const quality = o.quality === undefined ? undefined : Number(o.quality);
  const outputPath = typeof o.outputPath === 'string' && o.outputPath.trim() !== '' ? o.outputPath : undefined;

  if (width !== undefined && (!Number.isFinite(width) || width <= 0 || width > 20000)) throw new Error('width out of range');
  if (height !== undefined && (!Number.isFinite(height) || height <= 0 || height > 20000)) throw new Error('height out of range');

  const q = Number.isFinite(Number(quality)) ? Math.round(Number(quality)) : 80;
  const clampQuality = Math.max(1, Math.min(100, q));

  return {
    inputPath: o.inputPath,
    width: width === undefined ? undefined : Math.round(width),
    height: height === undefined ? undefined : Math.round(height),
    format,
    quality: clampQuality,
    outputPath,
  };
}

async function preparePathsAndChecks(opts: ImageProcessOptions) {
  // existence & size
  let stat;
  try {
    stat = await fsPromises.stat(opts.inputPath);
  } catch {
    throw new Error('Input file not found');
  }
  if (!stat.isFile()) throw new Error('Input path is not a file');
  if (stat.size > MAX_FILE_BYTES) throw new Error('Input file too large');

  // metadata to estimate pixels
  const meta = await sharp(opts.inputPath).metadata();
  const srcWidth = meta.width ?? 0;
  const srcHeight = meta.height ?? 0;
  const estWidth = opts.width ?? srcWidth;
  const estHeight = opts.height ?? srcHeight;
  if (estWidth <= 0 || estHeight <= 0) throw new Error('Invalid dimensions');

  const estimatedPixels = BigInt(estWidth) * BigInt(estHeight);
  if (estimatedPixels > BigInt(MAX_PIXELS)) throw new Error('Requested size too large');

  // extensions & output path
  const sourceExt = path.extname(opts.inputPath).slice(1).toLowerCase();
  const targetExt = (opts.format ?? sourceExt).toLowerCase();

  const downloadsDir = app.getPath('downloads');

  const outPath = path.join(
    downloadsDir,
    `${path.basename(opts.inputPath, path.extname(opts.inputPath))}-minimago-${Date.now()}.${targetExt}`
  );

  const resolvedOut = path.resolve(outPath);

  return { sourceExt, targetExt, resolvedOut, estWidth, estHeight };
}

export async function processImage(rawOpts: unknown): Promise<{ outputPath: string }> {
  const opts = normalizeAndCheckShape(rawOpts);
  const { targetExt, resolvedOut } = await preparePathsAndChecks(opts);

  let pipeline = sharp(opts.inputPath);
  if (opts.width || opts.height) pipeline = pipeline.resize(opts.width ?? null, opts.height ?? null);

  if (targetExt === 'jpeg' || targetExt === 'jpg') {
    pipeline = pipeline.jpeg({ quality: opts.quality ?? 80 });
  } else if (targetExt === 'png') {
    pipeline = pipeline.png(pngOptionsFromQuality(opts.quality));
  } else if (targetExt === 'webp') {
    pipeline = pipeline.webp({ quality: opts.quality ?? 80 });
  } else if (targetExt === 'avif') {
    pipeline = pipeline.avif({ quality: Math.max(10, Math.min(80, opts.quality ?? 50)) });
  } else if (targetExt === 'svg') {
    // @todo : sharp does not support svg output. Consider using another library if needed.
    throw new Error('SVG output format is not supported yet');
  }

  await fsPromises.mkdir(path.dirname(resolvedOut), { recursive: true });
  await pipeline.toFile(resolvedOut);

  return { outputPath: resolvedOut };
}

function pngOptionsFromQuality(q: number | undefined) {
  const quality = Math.max(1, Math.min(100, Number(q ?? 80)));
  const tier = Math.ceil(quality / 10) * 10;

  switch (tier) {
    case 10:
      return { palette: true, quality: 10, effort: 10, colours: 16, dither: 0.0, compressionLevel: 9, adaptiveFiltering: true };
    case 20:
      return { palette: true, quality: 20, effort: 9, colours: 32, dither: 0.1, compressionLevel: 9, adaptiveFiltering: true };
    case 30:
      return { palette: true, quality: 30, effort: 9, colours: 64, dither: 0.2, compressionLevel: 9, adaptiveFiltering: true };
    case 40:
      return { palette: true, quality: 40, effort: 8, colours: 96, dither: 0.3, compressionLevel: 9, adaptiveFiltering: true };
    case 50:
      return { palette: true, quality: 50, effort: 8, colours: 128, dither: 0.4, compressionLevel: 9, adaptiveFiltering: true };
    case 60:
      return { palette: true, quality: 60, effort: 8, colours: 160, dither: 0.5, compressionLevel: 9, adaptiveFiltering: true };
    case 70:
      return { palette: true, quality: 70, effort: 7, colours: 192, dither: 0.6, compressionLevel: 9, adaptiveFiltering: true };
    case 80:
      return { palette: true, quality: 80, effort: 7, colours: 224, dither: 0.75, compressionLevel: 9, adaptiveFiltering: true };
    case 90:
      return { palette: true, quality: 90, effort: 7, colours: 240, dither: 0.9, compressionLevel: 9, adaptiveFiltering: true };
    case 100:
    default:
      return { palette: false, compressionLevel: 9, adaptiveFiltering: true, progressive: false };
  }
}