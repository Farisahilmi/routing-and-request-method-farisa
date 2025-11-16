const fs = require('fs');
const path = require('path');

// Cache for translations
let translationsCache = {};
let supportedLanguages = ['en', 'id', 'es'];

// Load translation files
function loadTranslations() {
  const localesPath = path.join(__dirname, '..', 'locales');

  supportedLanguages.forEach(lang => {
    const filePath = path.join(localesPath, `${lang}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        translationsCache[lang] = JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading translation file for ${lang}:`, error);
    }
  });
}

// Get translation with fallback
function getTranslation(lang, key, fallback = '') {
  // Ensure language is supported
  if (!supportedLanguages.includes(lang)) {
    lang = 'en'; // Default fallback
  }

  // Load translations if not cached
  if (!translationsCache[lang]) {
    loadTranslations();
  }

  const keys = key.split('.');
  let value = translationsCache[lang];

  // Navigate through nested object
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Try English fallback
      if (lang !== 'en') {
        return getTranslation('en', key, fallback);
      }
      return fallback || key;
    }
  }

  return value || fallback || key;
}

// Get supported languages
function getSupportedLanguages() {
  return supportedLanguages;
}

// Check if language is supported
function isLanguageSupported(lang) {
  return supportedLanguages.includes(lang);
}

// Get language name
function getLanguageName(lang) {
  const names = {
    'en': 'English',
    'id': 'Bahasa Indonesia',
    'es': 'Español'
  };
  return names[lang] || lang;
}

// Get all translations for a language
function getTranslations(lang) {
  // Ensure language is supported
  if (!supportedLanguages.includes(lang)) {
    lang = 'en'; // Default fallback
  }

  // Load translations if not cached
  if (!translationsCache[lang]) {
    loadTranslations();
  }

  return translationsCache[lang] || {};
}

// Initialize translations on module load
loadTranslations();

// Export functions
module.exports = {
  getTranslation,
  getTranslations,
  getSupportedLanguages,
  isLanguageSupported,
  getLanguageName,
  loadTranslations
};
