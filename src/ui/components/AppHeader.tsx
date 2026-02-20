import { useTranslation } from 'react-i18next';

export default function AppHeader() {
  const { t, i18n } = useTranslation();

  function changeLang(lang: 'en' | 'fr') {
    if (lang === i18n.language) return;
    document.documentElement.classList.add('lang-changing');

    i18n.changeLanguage(lang).finally(() => {
      localStorage.setItem('minimago-lang', lang);

      window.setTimeout(() => {
        document.documentElement.classList.remove('lang-changing');
      }, 220);
    });
  }

  return (
    <div className="app-header">
      <h1>{t('app.title')}</h1>
      <div className="lang-switch" aria-label="language switch" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={i18n.language.startsWith('en')}
          className={`lang-btn ${i18n.language.startsWith('en') ? 'active' : ''}`}
          onClick={() => changeLang('en')}
        >
          EN
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={i18n.language.startsWith('fr')}
          className={`lang-btn ${i18n.language.startsWith('fr') ? 'active' : ''}`}
          onClick={() => changeLang('fr')}
        >
          FR
        </button>
      </div>
    </div>
  );
}
