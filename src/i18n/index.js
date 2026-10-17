import { ref, reactive } from 'vue';

function deepMerge(target, source) {
  const output = { ...(target || {}) };
  if (source && typeof source === 'object') {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in output)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(output[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

// Reactive store for loaded translation bundles
export const messages = reactive({
  ar: null,
  en: null,
});

const loadingPromises = {};

/**
 * Lazily loads a locale bundle on demand via dynamic import
 */
export async function loadLocaleMessages(lang) {
  const targetLang = lang === 'ar' ? 'ar' : 'en';

  if (messages[targetLang]) {
    return messages[targetLang];
  }

  if (loadingPromises[targetLang]) {
    return loadingPromises[targetLang];
  }

  loadingPromises[targetLang] = (async () => {
    try {
      if (targetLang === 'ar') {
        const [legacyMod, jsonMod] = await Promise.all([
          import('./ar.js'),
          import('./ar.json'),
        ]);
        messages.ar = deepMerge(legacyMod.default || legacyMod, jsonMod.default || jsonMod);
      } else {
        const [legacyMod, jsonMod] = await Promise.all([
          import('./en.js'),
          import('./en.json'),
        ]);
        messages.en = deepMerge(legacyMod.default || legacyMod, jsonMod.default || jsonMod);
      }
      return messages[targetLang];
    } catch (err) {
      console.warn(`[i18n] Failed to lazy load locale "${targetLang}":`, err);
      return null;
    } finally {
      delete loadingPromises[targetLang];
    }
  })();

  return loadingPromises[targetLang];
}

// Default language preference (Arabic default)
const savedLocale =
  (typeof localStorage !== 'undefined' &&
    (localStorage.getItem('tf_locale') || localStorage.getItem('taskorbit_locale'))) ||
  'ar';

export const currentLocale = ref(savedLocale);

// Apply document language and direction
function applyDirection(lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'ar') {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }
}

// Apply initial direction
applyDirection(currentLocale.value);

// Kick off lazy load for current locale immediately
loadLocaleMessages(currentLocale.value);

export async function setLocale(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  // Ensure the target locale bundle is loaded before/while switching
  await loadLocaleMessages(lang);
  currentLocale.value = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('taskorbit_locale', lang);
    localStorage.setItem('tf_locale', lang);
  }
  applyDirection(lang);
}

export async function toggleLocale() {
  const nextLocale = currentLocale.value === 'ar' ? 'en' : 'ar';
  await setLocale(nextLocale);
  return nextLocale;
}

/**
 * Universal translate helper supporting path traversal, params interpolation, and fallbacks.
 */
export function t(key, paramsOrFallback = {}) {
  const lang = currentLocale.value;
  const dict = messages[lang] || messages.ar || messages.en || {};

  const resolvePath = (obj, path) => {
    if (!obj || typeof obj !== 'object') return null;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  };

  let text = resolvePath(dict, key);
  if (text === null || text === undefined) {
    // Check fallback locale if available
    const fallbackDict = lang === 'ar' ? messages.en : messages.ar;
    if (fallbackDict) {
      text = resolvePath(fallbackDict, key);
    }
  }

  // Handle fallback string if key is not found
  if (text === null || text === undefined) {
    if (typeof paramsOrFallback === 'string') {
      return paramsOrFallback;
    }
    return key;
  }

  // Interpolate parameters if an object was passed
  if (typeof text === 'string' && paramsOrFallback && typeof paramsOrFallback === 'object') {
    Object.keys(paramsOrFallback).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramsOrFallback[paramKey]);
    });
  }

  return text;
}

/**
 * Extracts error message directly from backend response
 */
export function translateError(error) {
  if (!error) return 'An error occurred';

  let rawMessage = null;

  if (error.response && error.response.data) {
    const data = error.response.data;
    rawMessage = data.message || data.error || data.detail || null;

    if (!rawMessage && typeof data === 'object') {
      const firstField = Object.keys(data)[0];
      if (firstField && Array.isArray(data[firstField])) {
        rawMessage = `${firstField}: ${data[firstField][0]}`;
      } else if (firstField && typeof data[firstField] === 'string') {
        rawMessage = `${firstField}: ${data[firstField]}`;
      }
    }
  } else if (typeof error === 'string') {
    rawMessage = error;
  } else if (error.message) {
    rawMessage = error.message;
  }

  return rawMessage || 'An error occurred';
}

export function useI18n() {
  return {
    locale: currentLocale,
    t,
    setLocale,
    toggleLocale,
    translateError,
    loadLocaleMessages,
  };
}

export default {
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$translateError = translateError;
    app.config.globalProperties.$currentLocale = currentLocale;
    app.provide('i18n', {
      locale: currentLocale,
      t,
      setLocale,
      toggleLocale,
      translateError,
      loadLocaleMessages,
    });
  },
};
