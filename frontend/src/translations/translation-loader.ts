import { Resource } from "i18next";

// Use import.meta.glob so Vite includes translation files in the production bundle.
// With @vite-ignore dynamic imports, the .ts files are not available after build.
const modules = import.meta.glob<{ default: Record<string, string> }>([
    './*.ts',
    './**/*.ts',
    '!./i18n.ts',
    '!./translation-loader.ts'
], { eager: true });

export const loadTranslations = async (availableLanguages: string[], namespaces: string[]): Promise<Resource> => {
    const resources: Resource = {};

    for (const language of availableLanguages) {
        const rootKey = `./${language}.ts`;
        const rootMod = modules[rootKey];
        if (rootMod) {
            resources[language] = { ...rootMod.default };
        } else {
            resources[language] = {};
            console.error(`Root translation file not found: ${rootKey}`);
        }

        for (const namespace of namespaces) {
            const nsKey = `./${namespace}/${language}.ts`;
            const nsMod = modules[nsKey];
            if (nsMod) {
                resources[language][namespace] = nsMod.default;
            } else {
                console.error(`Translation file not found: ${nsKey}`);
                resources[language][namespace] = {};
            }
        }
    }

    return resources;
};
