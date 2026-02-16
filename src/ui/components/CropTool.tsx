import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
  type PercentCrop,
  convertToPercentCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function CropTool() {
  const { t } = useTranslation();

  const [filePath, setFilePath] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  const imgRef = useRef<HTMLImageElement>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [outputPath, setOutputPath] = useState<string | null>(null);

  async function handleSelectFile() {
    try {
      const paths = await window.electron.openFiles();
      if (paths && paths.length > 0) {
        const file = paths[0];
        setFilePath(file);

        const cleanPath = file.replace(/\\/g, '/');
        setImgSrc(`media:///${cleanPath}`);

        setOutputPath(null);
        setMessage('');
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialPercentCrop = centerAspectCrop(width, height, 16 / 9);
    setCrop(initialPercentCrop);
    const initialPixelCrop = convertToPixelCrop(
      initialPercentCrop,
      width,
      height,
    );
    setCompletedCrop(initialPixelCrop);
  }

  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
  ): PercentCrop {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  function centerHorizontal() {
    if (!imgRef.current || !completedCrop) return;
    const { width, height } = imgRef.current;

    const newX = (width - completedCrop.width) / 2;

    const newPixelCrop: PixelCrop = {
      ...completedCrop,
      x: newX,
    };

    const newPercentCrop = convertToPercentCrop(newPixelCrop, width, height);
    setCrop(newPercentCrop);
    setCompletedCrop(newPixelCrop);
  }

  function centerVertical() {
    if (!imgRef.current || !completedCrop) return;
    const { width, height } = imgRef.current;

    const newY = (height - completedCrop.height) / 2;

    const newPixelCrop: PixelCrop = {
      ...completedCrop,
      y: newY,
    };

    const newPercentCrop = convertToPercentCrop(newPixelCrop, width, height);
    setCrop(newPercentCrop);
    setCompletedCrop(newPixelCrop);
  }

  async function handleProcess() {
    if (!filePath || !completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    if (image.width === 0 || image.height === 0) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const realCrop = {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY),
    };

    if (realCrop.width <= 0 || realCrop.height <= 0) {
      setMessage(t('errors.invalidDimensions'));
      return;
    }

    setProcessing(true);
    setMessage(t('cropTool.processing'));
    setOutputPath(null);

    try {
      const result = await window.electron.processImage({
        inputPath: filePath,
        crop: realCrop,
      });

      if (result.success) {
        setMessage(t('cropTool.success'));
        setOutputPath(result.data.outputPath);

        setFilePath(null);
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
      } else {
        setMessage(t('errors.generic'));
      }
    } catch (error) {
      console.error(error);
      setMessage('Error');
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    setFilePath(null);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setOutputPath(null);
    setMessage('');
  }

  return (
    <div className="tool-container">
      <div className="card">
        <div className="card-header">
          <div className="title">{t('cropTool.title')}</div>
          <div className="subtitle">{t('cropTool.subtitle')}</div>
        </div>

        <div className="card-body">
          <div className="file-row">
            <button
              className="btn primary"
              onClick={handleSelectFile}
              disabled={processing}
            >
              {t('cropTool.choose')}
            </button>
            <div className="file-info">{filePath || t('cropTool.noFile')}</div>
          </div>

          <div className="crop-grid">
            <div className="crop-preview">
              {!imgSrc ? (
                <div className="crop-placeholder">
                  {t('cropTool.previewHint')}
                </div>
              ) : (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                >
                  <img
                    ref={imgRef}
                    alt="Crop target"
                    src={imgSrc}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>

            <div className="crop-controls">
              <label className="checkbox-label" htmlFor="aspect-lock">
                <input
                  type="checkbox"
                  id="aspect-lock"
                  checked={!!aspect}
                  onChange={(e) =>
                    setAspect(e.target.checked ? 16 / 9 : undefined)
                  }
                />
                {t('cropTool.lockRatio')}
              </label>

              <div className="actions actions-crop">
                <div className="actions-center">
                  <button
                    className="btn ghost"
                    onClick={centerHorizontal}
                    disabled={!imgSrc || processing}
                    style={{ flex: 1 }}
                    title={t('cropTool.centerHorizontal')}
                  >
                    {t('cropTool.centerHorizontal')}
                  </button>
                  <button
                    className="btn ghost"
                    onClick={centerVertical}
                    disabled={!imgSrc || processing}
                    style={{ flex: 1 }}
                    title={t('cropTool.centerVertical')}
                  >
                    {t('cropTool.centerVertical')}
                  </button>
                </div>

                <button
                  className="btn primary large"
                  onClick={handleProcess}
                  disabled={!filePath || !completedCrop || processing}
                >
                  {processing ? '...' : t('cropTool.process')}
                </button>
                <button
                  className="btn ghost"
                  onClick={handleReset}
                  disabled={processing}
                >
                  {t('cropTool.reset')}
                </button>
              </div>

              <div className="message" role="status" aria-live="polite">
                {message && <span className="message-text">{message}</span>}
                {outputPath && (
                  <div className="output-path">
                    {t('imageTool.output')}: {outputPath}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <small>{t('cropTool.recommended')}</small>
        </div>
      </div>
    </div>
  );
}
