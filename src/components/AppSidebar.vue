<template>
  <aside class="app-sidebar">
    <div class="sidebar-section-label">{{ t('nav.workspace') }}</div>

    <RouterLink to="/dashboard" class="sidebar-nav-item">
      <i class="bi bi-speedometer2"></i> {{ t('nav.dashboard') }}
    </RouterLink>
    <RouterLink to="/tasks" class="sidebar-nav-item">
      <i class="bi bi-check2-square"></i> {{ t('nav.my_tasks') }}
    </RouterLink>
    <RouterLink to="/tasks/available" class="sidebar-nav-item">
      <i class="bi bi-collection"></i> {{ t('nav.available_tasks') }}
    </RouterLink>
    <RouterLink to="/tasks/create" class="sidebar-nav-item">
      <i class="bi bi-plus-square"></i> {{ t('nav.create_task') }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.collaboration') }}</div>

    <RouterLink to="/task-requests" class="sidebar-nav-item">
      <i class="bi bi-envelope-arrow-up"></i> {{ t('nav.task_requests') }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.analytics') }}</div>

    <RouterLink to="/statistics" class="sidebar-nav-item">
      <i class="bi bi-graph-up-arrow"></i> {{ t('nav.statistics') }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.team') }}</div>

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
