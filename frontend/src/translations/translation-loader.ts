import { Resource } from "i18next";

const loadNsTranslation = async (language: string, namespace: string): Promise<Record<string, string>> => {
    try {
        const { default: translations } = await import(/* @vite-ignore */ `./${namespace}/${language}.ts`);
        return translations;
    } catch (error) {
        console.error(`Error while loading translation file (${language}, ${namespace}):`, error);
        return {};
    }
};

export const loadTranslations = async (availableLanguages: string[], namespaces: string[]): Promise<Resource> => {
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
