import path from 'path';
import fsPromises from 'fs/promises';
import sharp from 'sharp';
import { normalizeAndCheckShape } from './imageValidators.js';
import {
  preparePathsAndChecks,
  applyBackgroundRemoval,
  pngOptionsFromQuality,
} from './imageHelpers.js';
import type { ImageProcessOptions } from './imageTypes.js';

export type { ImageProcessOptions };

/**
 * Main function to process an image based on the provided options.
 */
export async function processImage(
  rawOpts: unknown,
): Promise<{ outputPath: string }> {
  const opts = normalizeAndCheckShape(rawOpts);
  const { targetExt, resolvedOut } = await preparePathsAndChecks(opts);

  const { effectiveExt, finalOutPath } = resolveFinalPath(
    opts,
    targetExt,
    resolvedOut,
  );

  let pipeline = sharp(opts.inputPath);

  pipeline = await applyTransformations(pipeline, opts);
  pipeline = applyFormat(pipeline, effectiveExt, opts.quality);

  await saveToFile(pipeline, finalOutPath);

  return { outputPath: finalOutPath };
}

/**
 * Forces PNG output if background removal is requested but the target format
 * (like JPEG) doesn't support transparency.
 */
function resolveFinalPath(
  opts: ImageProcessOptions,
  targetExt: string,
  resolvedOut: string,
) {
  if (opts.removeBg && (targetExt === 'jpeg' || targetExt === 'jpg')) {
    return {
      effectiveExt: 'png',
      finalOutPath: resolvedOut.replace(/\.jpe?g$/i, '.png'),
    };
  }
  return { effectiveExt: targetExt, finalOutPath: resolvedOut };
}

/**
 * Applies crop, resize, and background removal transformations to the Sharp pipeline.
 */
async function applyTransformations(
  pipeline: sharp.Sharp,
  opts: ImageProcessOptions,
): Promise<sharp.Sharp> {
  if (opts.removeBg) {
    pipeline = await applyBackgroundRemoval(pipeline, opts);
  }

  if (opts.crop) {
    pipeline = pipeline.extract({
      left: opts.crop.x,
      top: opts.crop.y,
      width: opts.crop.width,
      height: opts.crop.height,
    });
  }

  if (opts.width || opts.height) {
    pipeline = pipeline.resize(opts.width ?? null, opts.height ?? null);
  }

  return pipeline;
}

/**
 * Configures the output format and quality settings on the Sharp pipeline.
 */
function applyFormat(
  pipeline: sharp.Sharp,
  ext: string,
  quality?: number,
): sharp.Sharp {
  if (ext === 'jpeg' || ext === 'jpg') {
    return pipeline.jpeg({ quality: quality ?? 80 });
  }

  if (ext === 'png') {
    return pipeline.png(pngOptionsFromQuality(quality));
  }

  if (ext === 'webp') {
    return pipeline.webp({ quality: quality ?? 80 });
  }

  if (ext === 'avif') {
    return pipeline.avif({
      quality: Math.max(10, Math.min(80, quality ?? 50)),
    });
  }

  if (ext === 'svg') {
    throw new Error('SVG output format is not supported yet');
  }

  return pipeline;
}

/**
 * Creates the output file, ensuring the directory exists.
 * We rely on Sharp to throw if the path is invalid or unwritable.
 */
async function saveToFile(
  pipeline: sharp.Sharp,
  outputPath: string,
): Promise<void> {
  await fsPromises.mkdir(path.dirname(outputPath), { recursive: true });
  await pipeline.toFile(outputPath);
}
