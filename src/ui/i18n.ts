import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import fr from './locales/fr/common.json';

const savedLang =
  typeof window !== 'undefined' ? localStorage.getItem('minimago-lang') : null;

const initialLang =
  savedLang ||
  (typeof navigator !== 'undefined' &&
  String(navigator.language ?? '').startsWith('fr')
    ? 'fr'
    : 'en');

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    fr: { common: fr },
  },
  lng: initialLang,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined' && window.electron?.getAppLocale) {
  window.electron
    .getAppLocale()
    .then((raw: unknown) => {
      if (!localStorage.getItem('minimago-lang')) {
        const osLang = String(raw ?? '').startsWith('fr') ? 'fr' : 'en';
        if (osLang !== i18n.language) {
          i18n.changeLanguage(osLang);
        }
      }
    })
    .catch(() => {});
}

export default i18n;
