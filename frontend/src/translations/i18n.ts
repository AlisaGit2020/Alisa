import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { loadTranslations } from './translation-loader';


const availableLanguages = ['en', 'fi'];
const namespaces = [
    'property',
    'expense',
    'expense-type',
    'income-type',
    'menu',
    'route',
    'settings',
    'transaction'
];

const initializeI18n = async () => {
    const resources: Resource = await loadTranslations(availableLanguages, namespaces);
    
    i18n.use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        debug: false,
        fallbackLng: 'en',
        fallbackNS: ['common'],
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: resources
    });
    
};

await initializeI18n()
export default i18n;