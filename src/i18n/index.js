import { ref, reactive, computed } from 'vue';
import ar from './ar.js';
import en from './en.js';

const messages = { ar, en };

// Default language is Arabic
const savedLocale = localStorage.getItem('taskorbit_locale') || 'ar';
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

// Initial apply
applyDirection(currentLocale.value);

export function setLocale(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  currentLocale.value = lang;
  localStorage.setItem('taskorbit_locale', lang);
  applyDirection(lang);
}

export function toggleLocale() {
  const nextLocale = currentLocale.value === 'ar' ? 'en' : 'ar';
  setLocale(nextLocale);
  return nextLocale;
}

/**
 * Translate a key path (e.g. 'navbar.dashboard') with optional parameter interpolation
 */
export function t(key, params = {}) {
  const lang = currentLocale.value;
  const dict = messages[lang] || messages.ar;

  const resolvePath = (obj, path) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  };

  let text = resolvePath(dict, key);
  if (text === null || text === undefined) {
    // Fallback to English, then Arabic, then key itself
    text = resolvePath(messages.en, key);
    if (text === null || text === undefined) {
      text = resolvePath(messages.ar, key) || key;
    }
  }

  if (typeof text === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
    });
  }

  return text;
}

/**
 * Translates backend error responses into meaningful messages
 */
export function translateError(error) {
  if (!error) return t('errors.ERR_UNKNOWN');

  // Extract error code and error message from Axios response or Error object
  let code = null;
  let rawMessage = null;

  if (error.response && error.response.data) {
    const data = error.response.data;
    code = data.code || (typeof data.error === 'string' && data.error.startsWith('ERR_') ? data.error : null);
    rawMessage = data.message || data.error || data.detail || null;
    
    // Handle Django REST field errors { field: ["error message"] }
    if (typeof data === 'object' && !data.error && !data.detail) {
      const firstField = Object.keys(data)[0];
      if (firstField && Array.isArray(data[firstField])) {
        rawMessage = `${firstField}: ${data[firstField][0]}`;
      }
    }
  } else if (error.code) {
    code = error.code;
    rawMessage = error.message;
  } else if (typeof error === 'string') {
    if (error.startsWith('ERR_')) {
      code = error;
    } else {
      rawMessage = error;
    }
  } else if (error.message) {
    rawMessage = error.message;
  }

  // 1. Check if error code has a direct translation
  if (code) {
    const translatedCode = t(`errors.${code}`);
    if (translatedCode && translatedCode !== `errors.${code}`) {
      return translatedCode;
    }
  }

  // 2. Check if raw message has a translation mapping
  if (rawMessage) {
    const translatedMsg = t(`errors.${rawMessage}`);
    if (translatedMsg && translatedMsg !== `errors.${rawMessage}`) {
      return translatedMsg;
    }
  }

  // 3. Fallback for network error
  if (error.message && error.message.toLowerCase().includes('network')) {
    return t('errors.ERR_NETWORK');
  }

  // 4. Return raw message if readable, otherwise unknown error
  return rawMessage || t('errors.ERR_UNKNOWN');
}

export function useI18n() {
  return {
    locale: currentLocale,
    t,
    setLocale,
    toggleLocale,
    translateError,
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
    });
  },
};
