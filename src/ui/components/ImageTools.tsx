import { useState } from 'react';
import CustomSelect from './CustomSelect';

const FORMATS: Array<{ value: 'png'|'jpg'|'jpeg'|'webp'|'svg'|'avif'; label: string }> = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'svg', label: 'SVG' },
  { value: 'avif', label: 'AVIF' },
];

export default function ImageTool() {
  const [files, setFiles] = useState<string[]>([]);
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [format, setFormat] = useState<'png'|'jpg'|'jpeg'|'webp'|'svg'|'avif'>('png');
  const [quality, setQuality] = useState<number>(80);

  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  async function pickFiles() {
    setError(null);
    const picked = await window.electron.openFiles();
    setFiles(picked || []);
    setMessage('');
    setOutputPath(null);
  }

  function mapErrorToUserMessage(err: unknown) {
    const text = typeof err === 'string' ? err : err instanceof Error ? err.message : String(err);

    if (/Input file not found/i.test(text)) return 'Fichier introuvable. Vérifiez le chemin.';
    if (/Input file too large/i.test(text)) return 'Fichier trop volumineux (limite 100MB).';
    if (/Requested size too large/i.test(text)) return 'Taille demandée trop grande (risque mémoire).';
    if (/width out of range/i.test(text) || /height out of range/i.test(text)) return 'Dimensions hors limites.';
    if (/Invalid target format/i.test(text)) return 'Format non supporté.';

    return `Erreur : ${text}`;
  }

  async function process() {
    setError(null);
    setOutputPath(null);
    if (!files[0]) { setError('Aucun fichier sélectionné'); return; }
    setProcessing(true);
    setMessage('Traitement en cours…');

    try {
      const resp = await window.electron.processImage({
        inputPath: files[0],
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
        format,
        quality,
      });

      if (!resp.success) {
        setError(mapErrorToUserMessage(resp.error?.message ?? 'Erreur inconnue'));
      } else {
        setOutputPath(resp.data.outputPath);
        setMessage('Traitement terminé');
      }
    } catch (err) {
      setError(mapErrorToUserMessage(err));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="tool-container">
      <div className="card">
        <div className="card-header">
          <div className="title">Image Tools</div>
          <div className="subtitle">Redimensionne, convertit et compresse</div>
        </div>

        <div className="card-body">
          <div className="file-row">
            <button className="btn primary" onClick={pickFiles} disabled={processing}>Choisir une image</button>
            <div className="file-info">{files[0] ?? 'Aucun fichier sélectionné'}</div>
          </div>

          <div className="controls" aria-hidden={processing}>
            <div className="control">
              <label className="label">Largeur</label>
              <input
                className="input"
                type="number"
                placeholder="px"
                value={width === '' ? '' : width}
                onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={processing}
              />
            </div>

            <div className="control">
              <label className="label">Hauteur</label>
              <input
                className="input"
                type="number"
                placeholder="px"
                value={height === '' ? '' : height}
                onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={processing}
              />
            </div>

            <div className="control">
              <label className="label">Format</label>
              <CustomSelect
                options={FORMATS}
                value={format}
                onChange={v => setFormat(v)}
              />
            </div>

            <div className="control quality-control">
              <label className="label">Qualité <span className="quality-value">{quality}</span>%</label>
              <input
                className="range"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                disabled={processing}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn primary large" onClick={process} disabled={processing}>
              {processing ? 'Traitement…' : 'Traiter'}
            </button>
            <button className="btn ghost" onClick={() => { setFiles([]); setMessage(''); setError(null); setOutputPath(null); }} disabled={processing}>Réinitialiser</button>
          </div>

          <div className="message" role="status" aria-live="polite">
            {message && <span className="message-text">{message}</span>}
            {outputPath && (
              <div className="output-path">
                Sortie : {outputPath}
              </div>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <small>Format recommandé pour photos: webp / avif — PNG pour la transparence</small>
        </div>
      </div>
    </div>
  );
}