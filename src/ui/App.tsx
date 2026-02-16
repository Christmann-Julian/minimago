import './assets/styles/app.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageTool from './components/ImageTools';
import CropTool from './components/CropTool';
import AppHeader from './components/AppHeader';

function App() {
  const { t } = useTranslation();
  const [page, setPage] = useState<'resize' | 'crop'>('resize');

  return (
    <>
      <AppHeader />
      <div className="tool-container">
        <div style={{ width: '100%', maxWidth: '880px' }}>
          <div className="page-tabs" role="tablist" aria-label={t('nav.label')}>
            <button
              type="button"
              role="tab"
              aria-selected={page === 'resize'}
              className={`page-tab ${page === 'resize' ? 'active' : ''}`}
              onClick={() => setPage('resize')}
            >
              {t('nav.resize')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={page === 'crop'}
              className={`page-tab ${page === 'crop' ? 'active' : ''}`}
              onClick={() => setPage('crop')}
            >
              {t('nav.crop')}
            </button>
          </div>
        </div>
      </div>
      {page === 'resize' ? <ImageTool /> : <CropTool />}
    </>
  );
}

export default App;
