import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';
import en from './en.json';

const savedLanguage = localStorage.getItem('vj_language') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

// Apply initial document direction and font
const updateDocumentDirection = (lng: string) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  if (lng === 'ar') {
    document.body.classList.add('font-arabic');
  } else {
    document.body.classList.remove('font-arabic');
  }
};

updateDocumentDirection(savedLanguage);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('vj_language', lng);
  updateDocumentDirection(lng);
});

export default i18n;
