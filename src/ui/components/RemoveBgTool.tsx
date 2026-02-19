import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function RemoveBgTool() {
  const { t } = useTranslation();

  const [filePath, setFilePath] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');

  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [tolerance, setTolerance] = useState<number>(20);

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
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleProcess() {
    if (!filePath) return;

    setProcessing(true);
    setMessage(t('removeBg.processing'));
    setOutputPath(null);

    try {
      const result = await window.electron.processImage({
        inputPath: filePath,
        removeBg: true,
        bgColor: bgColor,
        bgTolerance: tolerance,
        format: 'png',
      });

      if (result.success) {
        setMessage(t('removeBg.success'));
        setOutputPath(result.data.outputPath);

        setFilePath(null);
        setImgSrc('');
      } else {
        setMessage(t('errors.generic'));
      }
    } catch (error) {
      console.error(error);
      setMessage(t('errors.generic'));
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    setFilePath(null);
    setImgSrc('');
    setOutputPath(null);
    setMessage('');
    setBgColor('#ffffff');
    setTolerance(20);
  }

  return (
    <div className="tool-container">
      <div className="card">
        <div className="card-header">
          <div className="title">{t('removeBg.title')}</div>
          <div className="subtitle">{t('removeBg.subtitle')}</div>
        </div>

        <div className="card-body">
          <div className="file-row">
            <button
              className="btn primary"
              onClick={handleSelectFile}
              disabled={processing}
            >
              {t('removeBg.choose')}
            </button>
            <div className="file-info">{filePath || t('removeBg.noFile')}</div>
          </div>

          <div className="crop-grid">
            <div className="crop-preview">
              {!imgSrc ? (
                <div className="crop-placeholder">
                  {t('removeBg.previewHint')}
                </div>
              ) : (
                <img alt="Target" src={imgSrc} />
              )}
            </div>

            <div className="crop-controls">
              <div className="control">
                <label className="label">{t('removeBg.colorToRemove')}</label>
                <div className="color-control">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <span>{bgColor.toUpperCase()}</span>
                </div>
              </div>

              <div
                className="control quality-control"
                style={{ marginBottom: '20px' }}
              >
                <label className="label">
                  {t('removeBg.bgTolerance')}{' '}
                  <span className="quality-value">{tolerance}</span>%
                </label>
                <input
                  className="range"
                  type="range"
                  min={0}
                  max={100}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  disabled={processing}
                />
                <small>{t('removeBg.bgToleranceDesc')}</small>
              </div>

              <div className="actions actions-crop">
                <button
                  className="btn primary large"
                  onClick={handleProcess}
                  disabled={!filePath || processing}
                >
                  {processing
                    ? t('removeBg.processing')
                    : t('removeBg.process')}
                </button>
                <button
                  className="btn ghost"
                  onClick={handleReset}
                  disabled={processing}
                >
                  {t('removeBg.reset')}
                </button>
              </div>

              <div className="message" role="status" aria-live="polite">
                {message && <span className="message-text">{message}</span>}
                {outputPath && (
                  <div className="output-path">
                    {t('removeBg.output')} {outputPath}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <small>{t('removeBg.recommended')}</small>
        </div>
      </div>
    </div>
  );
}
