import { computed } from 'vue'
import {
  currentLocale,
  t,
  setLocale,
  toggleLocale,
  translateError,
  loadLocaleMessages,
} from '@/i18n'

export function useI18n() {
  const locale = computed(() => currentLocale.value)
  const isRTL = computed(() => currentLocale.value === 'ar')

  return {
    locale,
    isRTL,
    setLocale,
    toggleLocale,
    t,
    translateError,
    loadLocaleMessages,
  }
}

export { currentLocale, t, setLocale, toggleLocale, translateError, loadLocaleMessages }
export default useI18n
