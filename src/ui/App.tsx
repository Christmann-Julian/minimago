import './assets/styles/app.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageTool from './components/ImageTools';
import CropTool from './components/CropTool';
import RemoveBgTool from './components/RemoveBgTool';
import AppHeader from './components/AppHeader';

function App() {
  const { t } = useTranslation();
  const [page, setPage] = useState<'resize' | 'crop' | 'removebg'>('resize');

  return (
    <>
      <AppHeader />
      <div className="page-tabs" role="tablist" aria-label={t('nav.label')}>
        <button
          className={`page-tab ${page === 'resize' ? 'active' : ''}`}
          onClick={() => setPage('resize')}
        >
          {t('nav.resize')}
        </button>
        <button
          className={`page-tab ${page === 'crop' ? 'active' : ''}`}
          onClick={() => setPage('crop')}
        >
          {t('nav.crop')}
        </button>
        <button
          className={`page-tab ${page === 'removebg' ? 'active' : ''}`}
          onClick={() => setPage('removebg')}
        >
          {t('nav.removebg')}
        </button>
      </div>

      {page === 'resize' && <ImageTool />}
      {page === 'crop' && <CropTool />}
      {page === 'removebg' && <RemoveBgTool />}
    </>
  );
}

export default App;
