import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


const availableLanguages = ['en', 'fi'];
const namespaces = [
    'apartment',
    'expense',
    'expense-type',
    'menu',
    'settings',
    'transaction'
];

const loadNsTranslation = async (language: string, namespace: string): Promise<Record<string, string>> => {
    try {
        const { default: translations } = await import(/* @vite-ignore */ `./${namespace}/${language}.ts`);
        return translations;
    } catch (error) {
        console.error(`Error while loading translation file (${language}, ${namespace}):`, error);
        return {};
    }
};

const loadResources = async () => {
    const resources: Resource = {};

    await Promise.all(
        availableLanguages.map(async (language) => {
            try {
                const { default: translations } = await import(/* @vite-ignore */`./${language}.ts`);
                resources[language] = translations


                await Promise.all(
                    namespaces.map(async (namespace) => {
                        const nsTranslations = await loadNsTranslation(language, namespace);
                        resources[language][namespace] = nsTranslations;
                    })
                );

            } catch (error) {
                console.error(`Error while loading translation file (${language}):`, error);
            }
        })
    );
    
    return resources;
};

const initializeI18n = async () => {
    const loadedResources = await loadResources();

    return loadedResources;
};

const resources = await initializeI18n();

i18n

    .use(LanguageDetector)
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

export default i18n;