<template>
  <div class="task-row">
    <div class="flex-grow-1 min-w-0">
      <div class="d-flex align-items-center gap-2 mb-1">
        <span class="fw-600 text-truncate" style="font-weight:600">{{ task.title }}</span>
        <span v-if="task.project" class="badge bg-info-subtle text-info border border-info-subtle py-1" style="font-size:0.65rem">
          <i class="bi bi-kanban me-1"></i>{{ task.project.name || task.project_name }}
        </span>
        <span :class="['status-badge', `priority-${task.priority?.toLowerCase()}`]" style="font-size:0.65rem">
          {{ t(`priorities.${task.priority}`, task.priority) }}
        </span>
      </div>
      <div class="d-flex align-items-center gap-3" style="font-size:0.78rem; color: var(--tf-text-muted)">
        <span v-if="task.creator_detail || task.creator">
          <i class="bi bi-person me-1"></i>{{ task.creator_detail?.display_name || task.creator_detail?.username || task.creator?.full_name || task.creator?.username }}
        </span>
        <span v-if="task.due_date">
          <i class="bi bi-calendar3 me-1"></i>{{ formatDate(task.due_date) }}
        </span>
        <span v-if="task.assignment_mode_display || task.assignment_mode || task.assignmentMode">
          <i class="bi bi-diagram-3 me-1"></i>{{ t('modes.' + (task.assignment_mode || task.assignmentMode), task.assignment_mode_display || task.assignment_mode || task.assignmentMode) }}
        </span>
      </div>
    </div>
    <TaskStatus :status="task.status" />
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n'
import TaskStatus from './TaskStatus.vue'
import { formatDate } from '@/utils/formatters'

const { t } = useI18n()

defineProps({
  task: { type: Object, required: true },
})
</script>
