export type ImageProcessOptions = {
  inputPath: string;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  width?: number;
  height?: number;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'avif';
  quality?: number;
  outputPath?: string;
  removeBg?: boolean;
  bgColor?: string;
  bgTolerance?: number;
};

export const ALLOWED_FORMATS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'avif',
  'svg',
] as const;
export const MAX_PIXELS = 100_000_000; // 100M pixels
export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
