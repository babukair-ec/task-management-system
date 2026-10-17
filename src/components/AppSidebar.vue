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
    <RouterLink to="/testing-queue" class="sidebar-nav-item">
      <i class="bi bi-patch-check"></i> {{ t('nav.testing_queue') || 'Testing Queue' }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.collaboration') }}</div>

    <RouterLink to="/task-requests" class="sidebar-nav-item">
      <i class="bi bi-envelope-arrow-up"></i> {{ t('nav.task_requests') }}
    </RouterLink>
    <RouterLink to="/supervision" class="sidebar-nav-item">
      <i class="bi bi-diagram-3"></i> {{ t('nav.supervision') || 'Supervision' }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.analytics') }}</div>

    <RouterLink to="/statistics" class="sidebar-nav-item">
      <i class="bi bi-graph-up-arrow"></i> {{ t('nav.statistics') }}
    </RouterLink>

    <div class="sidebar-section-label">{{ t('nav.team') }}</div>

    <RouterLink to="/employees" class="sidebar-nav-item">
      <i class="bi bi-people"></i> {{ t('nav.employees') }}
    </RouterLink>
    <RouterLink to="/departments" class="sidebar-nav-item">
      <i class="bi bi-buildings"></i> {{ t('nav.departments') }}
    </RouterLink>
    <RouterLink to="/projects" class="sidebar-nav-item">
      <i class="bi bi-kanban"></i> {{ t('nav.projects') }}
    </RouterLink>
    <RouterLink to="/departments-projects/assign" class="sidebar-nav-item">
      <i class="bi bi-person-check"></i> {{ t('nav.assign_to_unit') }}
    </RouterLink>
    <RouterLink to="/profile" class="sidebar-nav-item">
      <i class="bi bi-person-badge"></i> {{ t('nav.profile') }}
    </RouterLink>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
