import { ref, computed } from 'vue'

export const THEMES = [
  {
    id: 'dark',
    name: 'Dark Obsidian',
    icon: 'bi-moon-stars-fill',
    colors: ['#6366f1', '#1e1e2e', '#13131f']
  },
  {
    id: 'light',
    name: 'Clean Daylight',
    icon: 'bi-sun-fill',
    colors: ['#4f46e5', '#ffffff', '#f4f6fb']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: 'bi-lightning-charge-fill',
    colors: ['#ec4899', '#06b6d4', '#0a0614']
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    icon: 'bi-tree-fill',
    colors: ['#10b981', '#11221b', '#0a1612']
  },
  {
    id: 'royal',
    name: 'Midnight Royal',
    icon: 'bi-gem',
    colors: ['#f59e0b', '#818cf8', '#0b0f1e']
  }
]

const savedTheme = localStorage.getItem('tf_theme') || 'dark'
const currentTheme = ref(savedTheme)

function applyTheme(themeId) {
  const valid = THEMES.find(t => t.id === themeId) ? themeId : 'dark'
  currentTheme.value = valid
  localStorage.setItem('tf_theme', valid)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', valid)
    document.documentElement.setAttribute('data-bs-theme', valid === 'light' ? 'light' : 'dark')
  }
}

// Initial apply
applyTheme(savedTheme)

export function useTheme() {
  const theme = computed(() => currentTheme.value)
  const themeList = THEMES

  return {
    theme,
    themes: themeList,
    setTheme: applyTheme,
  }
}
