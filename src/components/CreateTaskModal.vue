<template>
  <div v-if="modelValue" class="tf-modal-backdrop" @click.self="close">
    <div class="tf-modal-dialog">
      <div class="tf-modal-content">
        <!-- Modal Header -->
        <div class="tf-modal-header">
          <div class="d-flex align-items-center gap-2">
            <div class="stat-icon" style="width:36px; height:36px; font-size:1.1rem; background:rgba(37,99,235,0.15); color:var(--tf-primary)">
              <i class="bi bi-plus-circle"></i>
            </div>
            <h5 class="tf-modal-title mb-0">{{ t('tasks.create_task') }}</h5>
          </div>
          <button type="button" class="btn-close-tf" @click="close" :aria-label="t('tasks.cancel')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="submitTask" class="tf-modal-body">
          <!-- Assignment Mode Toggle -->
          <div class="mb-3">
            <label class="tf-label mb-2">{{ t('tasks.assignment_mode') }}</label>
            <div class="d-flex gap-2 flex-wrap">
              <button
                type="button"
                class="btn btn-sm d-flex align-items-center gap-1"
                :class="form.assignment_mode === 'SELF' ? 'btn-tf-primary' : 'btn-tf-ghost'"
                @click="form.assignment_mode = 'SELF'"
              >
                <i class="bi bi-person"></i>
                <span>{{ t('tasks.mode_self') }}</span>
              </button>
              <button
                type="button"
                class="btn btn-sm d-flex align-items-center gap-1"
                :class="form.assignment_mode === 'DIRECT' ? 'btn-tf-primary' : 'btn-tf-ghost'"
                @click="setDirectMode"
              >
                <i class="bi bi-people"></i>
                <span>{{ t('tasks.mode_direct') }}</span>
              </button>
            </div>
          </div>

          <!-- Direct Assignee Dropdown (when DIRECT is selected) -->
          <div v-if="form.assignment_mode === 'DIRECT'" class="mb-3">
            <label class="tf-label">
              {{ t('tasks.select_subordinate') }} <span class="text-danger">*</span>
            </label>
            <div v-if="loadingSubordinates" class="text-muted small py-2 d-flex align-items-center gap-2">
              <span class="spinner-border spinner-border-sm text-primary"></span>
              <span>{{ t('common.loading') }}</span>
            </div>
            <select
              v-else-if="subordinates.length > 0"
              v-model="form.direct_assignee_id"
              class="form-select tf-input"
              required
            >
              <option value="" disabled>{{ t('tasks.select_subordinate') }}</option>
              <option v-for="sub in subordinates" :key="sub.outer_id" :value="sub.outer_id">
                {{ sub.full_name }} ({{ sub.job_title || 'Team Member' }})
              </option>
            </select>
            <div v-else class="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-0">
              <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <span>{{ t('tasks.no_subordinates') }}</span>
            </div>
          </div>

          <!-- Title -->
          <div class="mb-3">
            <label class="tf-label">
              {{ t('tasks.name') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              class="form-control tf-input"
              :placeholder="t('tasks.title_placeholder')"
              required
              autofocus
            />
          </div>

          <!-- Description -->
          <div class="mb-3">
            <label class="tf-label">{{ t('tasks.description') }}</label>
            <textarea
              v-model="form.description"
              class="form-control tf-input"
              rows="3"
              :placeholder="t('tasks.description_placeholder')"
            ></textarea>
          </div>

          <div class="row g-3 mb-3">
            <!-- Priority Selection -->
            <div class="col-12 col-md-6">
              <label class="tf-label">{{ t('tasks.priority') }}</label>
              <div class="priority-options-grid">
                <button
                  type="button"
                  v-for="pr in priorities"
                  :key="pr.key"
                  class="priority-choice-btn"
                  :class="{ active: form.priority === pr.key, [pr.class]: true }"
                  @click="form.priority = pr.key"
                >
                  <span>{{ t(`priorities.${pr.key}`, pr.label) }}</span>
                </button>
              </div>
            </div>

            <!-- Expected Time in Hours -->
            <div class="col-12 col-md-6">
              <label class="tf-label">{{ t('tasks.estimated_hours') }}</label>
              <div class="input-group">
                <input
                  v-model.number="form.estimated_hours"
                  type="number"
                  min="1"
                  step="1"
                  class="form-control tf-input"
                  :placeholder="t('tasks.estimated_hours_placeholder')"
                />
                <span class="input-group-text bg-transparent border-start-0 text-muted" style="border-color: var(--tf-border)">
                  {{ t('tasks.hours_unit') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="tf-modal-footer">
            <button
              type="button"
              class="btn btn-tf-ghost"
              @click="close"
              :disabled="loading"
            >
              {{ t('tasks.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-tf-primary d-flex align-items-center gap-2"
              :disabled="loading || !form.title.trim() || (form.assignment_mode === 'DIRECT' && !form.direct_assignee_id)"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
              <i v-else class="bi bi-check-lg"></i>
              <span>{{ loading ? t('tasks.creating') : t('tasks.create_button') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { tasksApi } from '@/api/tasks'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const loadingSubordinates = ref(false)
const subordinates = ref([])

const priorities = [
  { key: 'LOW', label: 'Low', class: 'pr-low' },
  { key: 'MEDIUM', label: 'Medium', class: 'pr-medium' },
  { key: 'HIGH', label: 'High', class: 'pr-high' },
  { key: 'URGENT', label: 'Urgent', class: 'pr-urgent' },
]

const form = reactive({
  title: '',
  description: '',
  status: 'DRAFT',
  priority: 'MEDIUM',
  estimated_hours: null,
  assignment_mode: 'SELF',
  direct_assignee_id: '',
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.status = 'DRAFT'
  form.priority = 'MEDIUM'
  form.estimated_hours = null
  form.assignment_mode = 'SELF'
  form.direct_assignee_id = ''
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

async function loadSubordinates() {
  if (subordinates.value.length > 0) return
  loadingSubordinates.value = true
  try {
    const res = await employeesApi.getHierarchy()
    subordinates.value = res.data?.subordinates || []
    if (subordinates.value.length > 0 && !form.direct_assignee_id) {
      form.direct_assignee_id = subordinates.value[0].outer_id
    }
  } catch (err) {
    console.error('Failed to load supervised employees:', err)
  } finally {
    loadingSubordinates.value = false
  }
}

async function setDirectMode() {
  form.assignment_mode = 'DIRECT'
  await loadSubordinates()
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && form.assignment_mode === 'DIRECT') {
    loadSubordinates()
  }
})

async function submitTask() {
  if (!form.title.trim()) return
  if (form.assignment_mode === 'DIRECT' && !form.direct_assignee_id) {
    toast.error(t('tasks.select_subordinate'))
    return
  }

  loading.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      status: form.assignment_mode === 'DIRECT' ? 'ASSIGNED' : 'DRAFT',
      priority: form.priority,
      assignment_mode: form.assignment_mode,
      estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours, 10) : null,
    }

    if (form.assignment_mode === 'DIRECT') {
      payload.direct_assignee_id = form.direct_assignee_id
    }

    const res = await tasksApi.createTask(payload)
    toast.success(t('tasks.created_success'))
    emit('created', res.data)
    close()
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message || 'Failed to create task'
    toast.error(errMsg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.tf-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease-out;
}

.tf-modal-dialog {
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
}

.tf-modal-content {
  background: var(--tf-surface-2);
  border: 1px solid var(--tf-border);
  border-radius: var(--tf-radius);
  box-shadow: var(--tf-shadow);
  display: flex;
  flex-direction: column;
}

.tf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--tf-border);
}

.tf-modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--tf-text);
}

.btn-close-tf {
  background: transparent;
  border: none;
  color: var(--tf-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--tf-radius-sm);
  transition: var(--tf-transition);
}

.btn-close-tf:hover {
  color: var(--tf-text);
  background: rgba(255, 255, 255, 0.08);
}

.tf-modal-body {
  padding: 1.5rem;
}

.priority-options-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.priority-choice-btn {
  padding: 0.35rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  border-radius: var(--tf-radius-sm);
  border: 1px solid var(--tf-border);
  background: var(--tf-surface-3);
  color: var(--tf-text-muted);
  cursor: pointer;
  transition: var(--tf-transition);
}

.priority-choice-btn:hover {
  border-color: var(--tf-primary);
  color: var(--tf-text);
}

.priority-choice-btn.active.pr-low {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
  color: #34d399;
}

.priority-choice-btn.active.pr-medium {
  background: rgba(6, 182, 212, 0.25);
  border-color: #06b6d4;
  color: #22d3ee;
}

.priority-choice-btn.active.pr-high {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  color: #fbbf24;
}

.priority-choice-btn.active.pr-urgent {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #f87171;
}

.tf-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>