<template>
  <RouterView />
  <!-- Global Toast Container -->
  <div class="toast-container-tf">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['tf-toast', `tf-toast-${toast.type}`]"
    >
      <i :class="toastIcon(toast.type)"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useToastStore } from '@/composables/useToast'
import { storeToRefs } from 'pinia'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

function toastIcon(type) {
  const icons = {
    success: 'bi bi-check-circle-fill text-success',
    error: 'bi bi-exclamation-triangle-fill text-danger',
    info: 'bi bi-info-circle-fill text-info',
  }
  return icons[type] || icons.info
}
</script>
