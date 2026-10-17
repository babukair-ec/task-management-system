import { ref, computed } from 'vue'

export const THEMES = [
  {
    id: 'dark',
    name: 'Dark Obsidian',
    icon: 'bi-moon-stars-fill',
    colors: ['#2563eb', '#161b22', '#0d1117']
  },
  {
    id: 'light',
    name: 'Clean Daylight',
    icon: 'bi-sun-fill',
    colors: ['#2563eb', '#ffffff', '#f4f6fb']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: 'bi-lightning-charge-fill',
    colors: ['#00f0ff', '#ff7700', '#06070d']
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    icon: 'bi-tree-fill',
    colors: ['#10b981', '#11221b', '#081510']
  },
  {
    id: 'royal',
    name: 'Midnight Royal',
    icon: 'bi-gem',
    colors: ['#3b82f6', '#0ea5e9', '#070a17']
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
