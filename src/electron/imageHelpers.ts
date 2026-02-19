import path from 'path';
import fsPromises from 'fs/promises';
import { app } from 'electron';
import sharp from 'sharp';
import {
  ImageProcessOptions,
  MAX_FILE_BYTES,
  MAX_PIXELS,
} from './imageTypes.js';

/**
 * Prepare the input and output paths, and perform initial checks on the input file and requested transformations.
 */
export async function preparePathsAndChecks(opts: ImageProcessOptions) {
  let stat;
  try {
    stat = await fsPromises.stat(opts.inputPath);
  } catch {
    throw new Error('Input file not found');
  }

  if (!stat.isFile()) throw new Error('Input path is not a file');
  if (stat.size > MAX_FILE_BYTES) throw new Error('Input file too large');

  const meta = await sharp(opts.inputPath).metadata();
  const srcWidth = meta.width ?? 0;
  const srcHeight = meta.height ?? 0;
  const estWidth = opts.width ?? srcWidth;
  const estHeight = opts.height ?? srcHeight;

  if (estWidth <= 0 || estHeight <= 0) throw new Error('Invalid dimensions');

  const estimatedPixels = BigInt(estWidth) * BigInt(estHeight);
  if (estimatedPixels > BigInt(MAX_PIXELS))
    throw new Error('Requested size too large');

  const sourceExt = path.extname(opts.inputPath).slice(1).toLowerCase();
  const targetExt = (opts.format ?? sourceExt).toLowerCase();

  const downloadsDir = app.getPath('downloads');
  const outPath = path.join(
    downloadsDir,
    `${path.basename(opts.inputPath, path.extname(opts.inputPath))}-minimago-${Date.now()}.${targetExt}`,
  );

  return {
    sourceExt,
    targetExt,
    resolvedOut: path.resolve(outPath),
    estWidth,
    estHeight,
  };
}

/**
 * Removes a specific background color from the image by setting its alpha channel to 0 (transparent).
 */
export async function applyBackgroundRemoval(
  pipeline: sharp.Sharp,
  opts: ImageProcessOptions,
): Promise<sharp.Sharp> {
  const hex = opts.bgColor || '#ffffff';
  const rTarget = parseInt(hex.slice(1, 3), 16);
  const gTarget = parseInt(hex.slice(3, 5), 16);
  const bTarget = parseInt(hex.slice(5, 7), 16);
  const tolerance = opts.bgTolerance !== undefined ? opts.bgTolerance : 20;

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (
      Math.abs(data[i] - rTarget) <= tolerance &&
      Math.abs(data[i + 1] - gTarget) <= tolerance &&
      Math.abs(data[i + 2] - bTarget) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

/**
 * Quality scale based on a percentage from 0 to 100 for PNG output
 */
export function pngOptionsFromQuality(q: number | undefined) {
  const quality = Math.max(1, Math.min(100, Number(q ?? 80)));
  const tier = Math.ceil(quality / 10) * 10;

  switch (tier) {
    case 10:
      return {
        palette: true,
        quality: 10,
        effort: 10,
        colours: 16,
        dither: 0.0,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 20:
      return {
        palette: true,
        quality: 20,
        effort: 9,
        colours: 32,
        dither: 0.1,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 30:
      return {
        palette: true,
        quality: 30,
        effort: 9,
        colours: 64,
        dither: 0.2,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 40:
      return {
        palette: true,
        quality: 40,
        effort: 8,
        colours: 96,
        dither: 0.3,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 50:
      return {
        palette: true,
        quality: 50,
        effort: 8,
        colours: 128,
        dither: 0.4,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 60:
      return {
        palette: true,
        quality: 60,
        effort: 8,
        colours: 160,
        dither: 0.5,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 70:
      return {
        palette: true,
        quality: 70,
        effort: 7,
        colours: 192,
        dither: 0.6,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 80:
      return {
        palette: true,
        quality: 80,
        effort: 7,
        colours: 224,
        dither: 0.75,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 90:
      return {
        palette: true,
        quality: 90,
        effort: 7,
        colours: 240,
        dither: 0.9,
        compressionLevel: 9,
        adaptiveFiltering: true,
      };
    case 100:
    default:
      return {
        palette: false,
        compressionLevel: 9,
        adaptiveFiltering: true,
        progressive: false,
      };
  }
}
