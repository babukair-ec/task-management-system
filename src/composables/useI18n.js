import { ref, computed } from 'vue'
import en from '@/i18n/en.json'
import ar from '@/i18n/ar.json'

const messages = { en, ar }

const savedLocale = localStorage.getItem('tf_locale') || 'en'
const currentLocale = ref(savedLocale)

function applyLocale(lang) {
  currentLocale.value = lang
  localStorage.setItem('tf_locale', lang)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }
}

// Initial apply
applyLocale(savedLocale)

export function useI18n() {
  function t(path, fallback = '') {
    const lang = currentLocale.value
    const dict = messages[lang] || messages.en
    const keys = path.split('.')
    let current = dict
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        // Fallback to English if missing in current locale
        let fb = messages.en
        for (const f of keys) {
          if (fb && typeof fb === 'object' && f in fb) {
            fb = fb[f]
          } else {
            return fallback || path
          }
        }
        return fb || fallback || path
      }
    }
    return current || fallback || path
  }

  const locale = computed(() => currentLocale.value)
  const isRTL = computed(() => currentLocale.value === 'ar')

  return {
    locale,
    isRTL,
    setLocale: applyLocale,
    t,
  }
}
