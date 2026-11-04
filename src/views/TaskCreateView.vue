<template>
  <div style="max-width:760px">
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-plus-square me-2"></i>{{ t('tasks.create_task') }}</h1>
    </div>

    <div class="tf-card">
      <form @submit.prevent="submit">
        <!-- Mode selector -->
        <div class="mb-4">
          <div class="tf-label mb-2">{{ t('tasks.assignment_mode') }}</div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="m in modes"
              :key="m.value"
              type="button"
              :class="['btn btn-sm', form.assignment_mode === m.value ? 'btn-tf-primary' : 'btn-tf-ghost']"
              @click="setMode(m.value)"
            >
              <i :class="m.icon + ' me-1'"></i>{{ m.label }}
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Title -->
        <div class="mb-3">
          <label class="tf-label">{{ t('tasks.name') }} *</label>
          <input
            v-model="form.title"
            id="task-title"
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
            id="task-description"
            class="form-control tf-input"
            rows="3"
            :placeholder="t('tasks.description_placeholder')"
          ></textarea>
        </div>

        <!-- Priority + Expected Hours -->
        <div class="row g-3 mb-3">
          <div class="col-6">
            <label class="tf-label">{{ t('tasks.priority') }}</label>
            <select v-model="form.priority" id="task-priority" class="form-select tf-input">
              <option value="LOW">{{ t('priorities.LOW', 'Low') }}</option>
              <option value="MEDIUM">{{ t('priorities.MEDIUM', 'Medium') }}</option>
              <option value="HIGH">{{ t('priorities.HIGH', 'High') }}</option>
              <option value="URGENT">{{ t('priorities.URGENT', 'Urgent') }}</option>
            </select>
          </div>
          <div class="col-6">
            <label class="tf-label">{{ t('tasks.estimated_hours') }}</label>
            <div class="input-group">
              <input
                v-model.number="form.estimated_hours"
                id="task-estimated-hours"
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

        <!-- DIRECT: Assign To Supervised Employee -->
        <div v-if="form.assignment_mode === 'DIRECT'" class="mb-3">
          <label class="tf-label">{{ t('tasks.select_subordinate') }} *</label>
          <div v-if="loadingSubordinates" class="text-muted small py-2 d-flex align-items-center gap-2">
            <span class="spinner-border spinner-border-sm text-primary"></span>
            <span>{{ t('common.loading') }}</span>
          </div>
          <select
            v-else-if="subordinates.length > 0"
            v-model="form.direct_assignee_id"
            id="task-assignee"
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

        <div v-if="errorMsg" class="alert alert-danger py-2 mt-3" style="font-size:0.82rem">
          <i class="bi bi-exclamation-triangle me-1"></i>{{ errorMsg }}
        </div>

        <div class="d-flex gap-2 mt-4 justify-content-end">
          <RouterLink to="/tasks" class="btn btn-tf-ghost">{{ t('tasks.cancel') }}</RouterLink>
          <button type="submit" class="btn btn-tf-primary" :disabled="submitting || !form.title.trim() || (form.assignment_mode === 'DIRECT' && !form.direct_assignee_id)">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-check-lg me-2"></i>
            {{ t('tasks.create_button') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const submitting = ref(false)
const errorMsg = ref('')
const loadingSubordinates = ref(false)
const subordinates = ref([])

const form = ref({
  title: '',
  description: '',
  priority: 'MEDIUM',
  assignment_mode: 'SELF',
  estimated_hours: null,
  direct_assignee_id: '',
})

const modes = computed(() => [
  { value: 'SELF', icon: 'bi bi-person-check', label: t('tasks.mode_self') },
  { value: 'DIRECT', icon: 'bi bi-person-arrow-right', label: t('tasks.mode_direct') },
])

async function loadSubordinates() {
  if (subordinates.value.length > 0) return
  loadingSubordinates.value = true
  try {
    const res = await employeesApi.getHierarchy()
    subordinates.value = res.data?.subordinates || []
    if (subordinates.value.length > 0 && !form.value.direct_assignee_id) {
      form.value.direct_assignee_id = subordinates.value[0].outer_id
    }
  } catch (err) {
    console.error('Failed to load supervised employees:', err)
  } finally {
    loadingSubordinates.value = false
  }
}

async function setMode(mode) {
  form.value.assignment_mode = mode
  if (mode === 'DIRECT') {
    await loadSubordinates()
  }
}

async function submit() {
  if (!form.value.title.trim()) return

  if (form.value.assignment_mode === 'DIRECT' && !form.value.direct_assignee_id) {
    errorMsg.value = t('tasks.select_subordinate')
    return
  }

  submitting.value = true
  errorMsg.value = ''

  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || '',
      priority: form.value.priority,
      assignment_mode: form.value.assignment_mode,
      status: form.value.assignment_mode === 'DIRECT' ? 'ASSIGNED' : 'DRAFT',
      estimated_hours: form.value.estimated_hours ? parseInt(form.value.estimated_hours, 10) : null,
    }

    if (form.value.assignment_mode === 'DIRECT') {
      payload.direct_assignee_id = form.value.direct_assignee_id
    }

    await tasksApi.createTask(payload)
    toast.success(t('tasks.created_success'))
    router.push('/tasks')
  } catch (e) {
    errorMsg.value = e.response?.data?.error || e.message || 'Failed to create task'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (form.value.assignment_mode === 'DIRECT') {
    loadSubordinates()
  }
})
</script>

<style scoped>
.divider {
  height: 1px;
  background: var(--tf-border);
  margin: 1.25rem 0;
}
</style>
