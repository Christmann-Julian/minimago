import path from 'path';
import sharp from 'sharp';
import fsPromises from 'fs/promises';

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

  const defaultOut = path.join(
    path.dirname(opts.inputPath),
    `${path.basename(opts.inputPath, path.extname(opts.inputPath))}-out.${targetExt}`
  );
  const outPath = opts.outputPath ?? defaultOut;

  const resolvedOut = path.resolve(outPath);
  const resolvedOutDir = path.dirname(resolvedOut);
  const allowedBase = path.resolve(path.dirname(opts.inputPath));
  const allowedPrefix = allowedBase + path.sep;
  if (!(resolvedOutDir === allowedBase || resolvedOutDir.startsWith(allowedPrefix))) {
    throw new Error('outputPath must be inside the input file directory');
  }

  return { sourceExt, targetExt, resolvedOut, estWidth, estHeight };
}

export async function processImage(rawOpts: unknown): Promise<{ outputPath: string }> {
  const opts = normalizeAndCheckShape(rawOpts);
  const { sourceExt, targetExt, resolvedOut } = await preparePathsAndChecks(opts);

  let pipeline = sharp(opts.inputPath);
  if (opts.width || opts.height) pipeline = pipeline.resize(opts.width ?? null, opts.height ?? null);

  if (targetExt === 'jpeg' || targetExt === 'jpg') {
    pipeline = pipeline.jpeg({ quality: opts.quality ?? 80 });
  } else if (targetExt === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (targetExt === 'webp') {
    pipeline = pipeline.webp({ quality: opts.quality ?? 80 });
  } else if (targetExt === 'avif') {
    pipeline = pipeline.avif({ quality: Math.max(10, Math.min(80, opts.quality ?? 50)) });
  } else if (targetExt === 'svg') {
    if (sourceExt === 'svg' && opts.width === undefined && opts.height === undefined) {
      await fsPromises.copyFile(opts.inputPath, resolvedOut);
      return { outputPath: resolvedOut };
    } else {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    }
  }

  await fsPromises.mkdir(path.dirname(resolvedOut), { recursive: true });
  await pipeline.toFile(resolvedOut);

  return { outputPath: resolvedOut };
}