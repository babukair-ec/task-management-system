<template>
  <aside class="app-sidebar">
    <div class="sidebar-section-label">{{ t('nav.workspace') }}</div>

    <RouterLink to="/dashboard" class="sidebar-nav-item">
      <i class="bi bi-speedometer2"></i> {{ t('nav.dashboard') }}
    </RouterLink>

    <RouterLink to="/tasks" class="sidebar-nav-item">
      <i class="bi bi-check2-square"></i> {{ t('nav.tasks') }}
    </RouterLink>

    <RouterLink to="/employees" class="sidebar-nav-item">
      <i class="bi bi-people"></i> {{ t('nav.employees') }}
    </RouterLink>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
