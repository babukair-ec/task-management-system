import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function show(message, type = 'info', duration = 3500) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function success(message) { show(message, 'success') }
  function error(message)   { show(message, 'error', 5000) }
  function info(message)    { show(message, 'info') }

  return { toasts, show, success, error, info }
})

// Composable shortcut for use in components
export function useToast() {
  return useToastStore()
}
