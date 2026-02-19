type EventPayloadMapping = {
  'dialog:openFiles': string[];
  'image:process': { outputPath: string };
};

interface Window {
  electron: {
    openFiles: () => Promise<string[]>;
    processImage: (opts: {
      inputPath: string;
      crop?: { x: number; y: number; width: number; height: number };
      width?: number;
      height?: number;
      format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'avif';
      quality?: number;
      outputPath?: string;
      removeBg?: boolean;
      bgColor?: string;
      bgTolerance?: number;
    }) => Promise<
      | { success: true; data: { outputPath: string } }
      | { success: false; error: { code: string; message: string } }
    >;
    getAppLocale: () => Promise<string>;
  };
}
