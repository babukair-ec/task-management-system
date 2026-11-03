<template>
  <div class="task-row position-relative">
    <div class="flex-grow-1 min-w-0">
      <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
        <span class="fw-600 text-truncate" style="font-weight:600">{{ currentTask.title }}</span>
        <span v-if="currentTask.project || currentTask.project_name" class="badge bg-info-subtle text-info border border-info-subtle py-1" style="font-size:0.65rem">
          <i class="bi bi-kanban me-1"></i>{{ currentTask.project?.name || currentTask.project_name }}
        </span>
        <span :class="['status-badge', `priority-${currentTask.priority?.toLowerCase()}`]" style="font-size:0.65rem">
          {{ t(`priorities.${currentTask.priority}`, currentTask.priority) }}
        </span>
      </div>
      <div class="d-flex align-items-center gap-3 flex-wrap" style="font-size:0.78rem; color: var(--tf-text-muted)">
        <span v-if="currentTask.creator_detail || currentTask.creator">
          <i class="bi bi-person me-1"></i>{{ currentTask.creator_detail?.display_name || currentTask.creator_detail?.username || currentTask.creator?.full_name || currentTask.creator?.username }}
        </span>
        <span v-if="currentTask.due_date">
          <i class="bi bi-calendar3 me-1"></i>{{ formatDate(currentTask.due_date) }}
        </span>
        <span v-if="currentTask.assignment_mode_display || currentTask.assignment_mode || currentTask.assignmentMode">
          <i class="bi bi-diagram-3 me-1"></i>{{ t('modes.' + (currentTask.assignment_mode || currentTask.assignmentMode), currentTask.assignment_mode_display || currentTask.assignment_mode || currentTask.assignmentMode) }}
        </span>
      </div>
    </div>

    <!-- Quick Status Changer Dropdown -->
    <div class="dropdown" @click.stop>
      <button
        class="status-dropdown-btn"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        :title="t('tasks.change_status')"
      >
        <TaskStatus :status="currentTask.status" />
        <i class="bi bi-chevron-down ms-1" style="font-size:0.65rem; opacity:0.6"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-1" style="background:var(--tf-surface-2); border:1px solid var(--tf-border)!important; min-width:160px; z-index:1060">
        <li class="dropdown-header small text-muted text-uppercase py-1 px-3" style="font-size:0.65rem">
          {{ t('tasks.change_status') }}
        </li>
        <li v-for="st in statusChoices" :key="st">
          <button
            type="button"
            class="dropdown-item d-flex align-items-center justify-content-between py-1 px-3 small"
            :class="{ active: currentTask.status === st }"
            @click="updateStatus(st)"
            :disabled="updating"
          >
            <div class="d-flex align-items-center gap-2">
              <i :class="getStatusIcon(st)"></i>
              <span>{{ t(`status.${st}`, st) }}</span>
            </div>
            <i v-if="currentTask.status === st" class="bi bi-check2 text-primary"></i>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import TaskStatus from './TaskStatus.vue'
import { formatDate } from '@/utils/formatters'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  task: { type: Object, required: true },
})

const emit = defineEmits(['status-changed'])

const { t } = useI18n()
const toast = useToast()
const updating = ref(false)
const currentTask = ref({ ...props.task })

watch(() => props.task, (newVal) => {
  currentTask.value = { ...newVal }
}, { deep: true })

const statusChoices = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']

function getStatusIcon(status) {
  switch (status) {
    case 'DRAFT': return 'bi bi-pencil'
    case 'ASSIGNED': return 'bi bi-person-check text-primary'
    case 'IN_PROGRESS': return 'bi bi-play-circle text-warning'
    case 'COMPLETED': return 'bi bi-check-circle text-success'
    case 'BLOCKED': return 'bi bi-exclamation-octagon text-danger'
    case 'CANCELLED': return 'bi bi-x-circle text-muted'
    default: return 'bi bi-circle'
  }
}

async function updateStatus(newStatus) {
  if (currentTask.value.status === newStatus || updating.value) return

  updating.value = true
  const prevStatus = currentTask.value.status
  currentTask.value.status = newStatus

  try {
    const taskId = currentTask.value.outer_id || currentTask.value.id
    await tasksApi.updateTask(taskId, { status: newStatus })
    toast.success(t('tasks.status_updated'))
    emit('status-changed', { task: currentTask.value, newStatus, prevStatus })
  } catch (err) {
    currentTask.value.status = prevStatus
    const errMsg = err.response?.data?.error || err.message || 'Failed to update task status'
    toast.error(errMsg)
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.status-dropdown-btn {
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  border-radius: 999px;
  transition: transform 0.15s ease;
}

.status-dropdown-btn:hover {
  transform: scale(1.04);
}

.dropdown-item {
  color: var(--tf-text);
  transition: background 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--tf-text);
}

.dropdown-item.active {
  background: var(--tf-primary-glow);
  color: var(--tf-primary);
  font-weight: 600;
}
</style>
