const { isLanguageSupported, getSupportedLanguages } = require('../helpers/translation');

// Language detection middleware
function languageMiddleware(req, res, next) {
  // Get language from various sources (priority order)
  let language = getLanguageFromRequest(req);
  const languageFromQuery = req.query.lang && isLanguageSupported(req.query.lang) ? req.query.lang : null;

  // Validate language
  if (!isLanguageSupported(language)) {
    language = 'en'; // Default fallback
  }

  // If language came from query parameter and user is not logged in, save to cookie
  if (languageFromQuery && language === languageFromQuery && (!req.session || !req.session.user)) {
    setLanguageCookie(res, language);
  }

  // Set language in res.locals for templates
  res.locals.language = language;
  res.locals.supportedLanguages = getSupportedLanguages();

  // Set language in res for API responses if needed
  res.language = language;

  next();
}

// Get language from request (multiple sources)
function getLanguageFromRequest(req) {
  // 1. Check user session preference (highest priority)
  if (req.session && req.session.user && req.session.user.language) {
    return req.session.user.language;
  }

  // 2. Check query parameter (?lang=en)
  if (req.query.lang && isLanguageSupported(req.query.lang)) {
    return req.query.lang;
  }

  // 3. Check cookie
  if (req.cookies && req.cookies.language && isLanguageSupported(req.cookies.language)) {
    return req.cookies.language;
  }

  // 4. Check Accept-Language header (browser preference)
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const preferredLanguage = parseAcceptLanguage(acceptLanguage);
    if (preferredLanguage) {
      return preferredLanguage;
    }
  }

  // 5. Default to English
  return 'en';
}

// Parse Accept-Language header
function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return null;

  // Split by comma and get first language
  const languages = acceptLanguage.split(',').map(lang => {
    // Remove quality value (e.g., "en-US;q=0.9" -> "en-US")
    return lang.split(';')[0].trim().toLowerCase();
  });

  // Check full locale first (e.g., "en-US")
  for (const lang of languages) {
    if (isLanguageSupported(lang)) {
      return lang;
    }
  }

  // Check language prefix (e.g., "en" from "en-US")
  for (const lang of languages) {
    const prefix = lang.split('-')[0];
    if (isLanguageSupported(prefix)) {
      return prefix;
    }
  }

  return null;
}

// Set language cookie
function setLanguageCookie(res, language) {
  res.cookie('language', language, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

// Clear language cookie
function clearLanguageCookie(res) {
  res.clearCookie('language');
}

module.exports = {
  languageMiddleware,
  getLanguageFromRequest,
  setLanguageCookie,
  clearLanguageCookie
};
