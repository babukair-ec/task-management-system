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
            <div>
              <h5 class="tf-modal-title mb-0">{{ t('tasks.create_task') }}</h5>
              <small class="text-muted">{{ t('tasks.create_task_subtitle') }}</small>
            </div>
          </div>
          <button type="button" class="btn-close-tf" @click="close" :aria-label="t('tasks.cancel')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="submitTask" class="tf-modal-body">
          <!-- Title -->
          <div class="mb-3">
            <label class="tf-label">
              {{ t('tasks.title') }} <span class="text-danger">*</span>
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

            <!-- Due Date -->
            <div class="col-12 col-md-6">
              <label class="tf-label">{{ t('tasks.due_date') }}</label>
              <input
                v-model="form.due_date"
                type="date"
                class="form-control tf-input"
              />
            </div>
          </div>

          <!-- Self Task & Draft State Notice -->
          <div class="alert-self-task mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-info-circle text-primary"></i>
              <small>{{ t('modes.SELF') }} &mdash; {{ t('tasks.create_self_task') }}</small>
            </div>
            <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle py-1 px-2 d-flex align-items-center gap-1" style="font-size:0.72rem">
              <i class="bi bi-pencil"></i>
              {{ t('status.DRAFT') }}
            </span>
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
              :disabled="loading || !form.title.trim()"
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
import { reactive, ref } from 'vue'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)

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
  due_date: '',
  assignment_mode: 'SELF',
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.status = 'DRAFT'
  form.priority = 'MEDIUM'
  form.due_date = ''
  form.assignment_mode = 'SELF'
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

async function submitTask() {
  if (!form.title.trim()) return

  loading.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      status: 'DRAFT',
      priority: form.priority,
      assignment_mode: 'SELF',
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
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

.alert-self-task {
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: var(--tf-radius-sm);
  padding: 0.65rem 0.85rem;
  color: var(--tf-text-muted);
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
