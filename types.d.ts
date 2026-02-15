type EventPayloadMapping = {
  'dialog:openFiles': string[];
  'image:process': { outputPath: string };
};

interface Window {
  electron: {
    openFiles: () => Promise<string[]>;
    processImage: (opts: {
      inputPath: string;
      width?: number;
      height?: number;
      format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'avif';
      quality?: number;
      outputPath?: string;
    }) => Promise<
      | { success: true; data: { outputPath: string } }
      | { success: false; error: { code: string; message: string } }
    >;
    getAppLocale: () => Promise<string>;
  };
}
