let translations = {};

async function fetchTranslations(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        if (!response.ok) {
            console.error(`Could not load translation file for ${lang}.`);
            return {};
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching translation file for ${lang}:`, error);
        return {};
    }
}

function translateElement(element, key) {
    const translation = translations[key];
    if (translation) {
        // Support for HTML in translations
        element.innerHTML = translation;
    }
}

function translatePage() {
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        translateElement(element, key);
    });

    document.querySelectorAll('[data-i18n-placeholder-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder-key');
        const translation = translations[key];
        if (translation) {
            element.placeholder = translation;
        }
    });
}

function getTranslation(key, replacements = {}) {
    let translation = translations[key] || key;
    for (const placeholder in replacements) {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translation = translation.replace(regex, replacements[placeholder]);
    }
    return translation;
}

async function setLanguage(lang) {
    translations = await fetchTranslations(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('rok-calculator-lang', lang);
    translatePage();
}

function getLanguage() {
    return localStorage.getItem('rok-calculator-lang') || 'en';
}

async function initI18n() {
    const savedLang = getLanguage();
    await setLanguage(savedLang);
}

export { setLanguage, initI18n, getTranslation }; 