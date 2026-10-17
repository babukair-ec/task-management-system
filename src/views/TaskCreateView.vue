<template>
  <div style="max-width:760px">
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-plus-square me-2"></i>{{ t('tasks.create_title') }}</h1>
      <p class="page-subtitle">{{ t('tasks.create_subtitle') }}</p>
    </div>

    <div class="tf-card">
      <form @submit.prevent="submit">
        <!-- Mode selector -->
        <div class="mb-4">
          <div class="tf-label mb-2">{{ t('tasks.mode') }}</div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="m in modes" :key="m.value" type="button"
              :class="['btn btn-sm', form.assignment_mode === m.value ? 'btn-tf-primary' : 'btn-tf-ghost']"
              @click="form.assignment_mode = m.value"
            >
              <i :class="m.icon + ' me-1'"></i>{{ m.label }}
            </button>
          </div>
          <p class="text-muted mt-2" style="font-size:0.78rem">{{ currentMode?.desc }}</p>
        </div>

        <div class="divider"></div>

        <!-- Title -->
        <div class="mb-3">
          <label class="tf-label">{{ t('tasks.task_title') }} *</label>
          <input v-model="form.title" id="task-title" type="text" class="form-control tf-input" :placeholder="t('tasks.title_placeholder')" required />
        </div>

        <!-- Description -->
        <div class="mb-3">
          <label class="tf-label">{{ t('tasks.description') }}</label>
          <textarea v-model="form.description" id="task-description" class="form-control tf-input" rows="3" :placeholder="t('tasks.description_placeholder')"></textarea>
        </div>

        <!-- Priority + Due Date -->
        <div class="row g-3 mb-3">
          <div class="col-6">
            <label class="tf-label">{{ t('tasks.priority') }}</label>
            <select v-model="form.priority" id="task-priority" class="form-select tf-input">
              <option value="LOW">{{ t('priorities.LOW') }}</option>
              <option value="MEDIUM">{{ t('priorities.MEDIUM') }}</option>
              <option value="HIGH">{{ t('priorities.HIGH') }}</option>
              <option value="URGENT">{{ t('priorities.URGENT') }}</option>
            </select>
          </div>
          <div class="col-6">
            <label class="tf-label">{{ t('tasks.due_date') }}</label>
            <input v-model="form.due_date" id="task-due-date" type="date" class="form-control tf-input" />
          </div>
        </div>

        <!-- Project (Optional) -->
        <div class="mb-3">
          <label class="tf-label">{{ t('tasks.project') || 'Project' }}</label>
          <select v-model="form.project_id" id="task-project" class="form-select tf-input">
            <option :value="null">{{ t('tasks.no_project') || 'None (Standalone Task)' }}</option>
            <option v-for="proj in projects" :key="proj.id" :value="proj.id">
              {{ proj.name }} ({{ proj.code }})
            </option>
          </select>
          <div class="form-text small text-muted">
            <i class="bi bi-info-circle me-1"></i>
            {{ t('tasks.project_help') || 'If assigned to a project, the project manager will review the task upon submission.' }}
          </div>
        </div>

        <!-- DIRECT: assignee -->
        <div v-if="form.assignment_mode === 'DIRECT'" class="mb-3">
          <label class="tf-label">{{ t('tasks.assignee') }} *</label>
          <EmployeeSelector v-model="form.assignee_id" :placeholder="t('tasks.assignee_placeholder')" />
        </div>

        <!-- CLAIM: eligible employees -->
        <div v-if="form.assignment_mode === 'CLAIM'" class="mb-3">
          <label class="tf-label">{{ t('tasks.allowed_employees') }} *</label>
          <EmployeeSelector v-model="form.eligible_employee_ids" :multiple="true" :placeholder="t('tasks.claimants_placeholder')" />
        </div>

        <!-- REQUEST: send request after creation -->
        <div v-if="form.assignment_mode === 'REQUEST'" class="mb-3">
          <label class="tf-label">{{ t('tasks.requested_from') }} *</label>
          <EmployeeSelector v-model="form.request_employee_id" :placeholder="t('tasks.request_placeholder')" />
          <p class="text-muted mt-1" style="font-size:0.75rem">{{ t('tasks.request_auto_info') }}</p>
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2 mt-3" style="font-size:0.82rem">
          <i class="bi bi-exclamation-triangle me-1"></i>{{ errorMsg }}
        </div>

        <div class="d-flex gap-2 mt-4 justify-content-end">
          <RouterLink to="/tasks" class="btn btn-tf-ghost">{{ t('tasks.cancel_btn') }}</RouterLink>
          <button type="submit" class="btn btn-tf-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-check-lg me-1"></i>
            {{ t('tasks.create_btn') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { useAuthStore } from '@/stores/auth'

const EmployeeSelector = defineAsyncComponent(() => import('@/components/EmployeeSelector.vue'))

const router = useRouter()
const toast  = useToast()
const { t }  = useI18n()
const authStore = useAuthStore()

const submitting = ref(false)
const errorMsg   = ref('')
const projects   = ref([])

const modes = computed(() => [
  { value: 'SELF',    icon: 'bi-person',       label: t('modes.SELF'),    desc: t('tasks.channel_self_desc') },
  { value: 'DIRECT',  icon: 'bi-person-check', label: t('modes.DIRECT'),  desc: t('tasks.channel_direct_desc') },
  { value: 'CLAIM',   icon: 'bi-broadcast',    label: t('modes.CLAIM'),   desc: t('tasks.channel_claim_desc') },
  { value: 'REQUEST', icon: 'bi-send',         label: t('modes.REQUEST'), desc: t('tasks.channel_request_desc') },
])

const form = ref({
  title: '',
  description: '',
  priority: 'MEDIUM',
  assignment_mode: 'SELF',
  due_date: '',
  project_id: null,
  assignee_id: null,
  eligible_employee_ids: [],
  request_employee_id: null,
})

const currentMode = computed(() => modes.value.find(m => m.value === form.value.assignment_mode))

onMounted(async () => {
  try {
    const res = await employeesApi.listDepartmentsProjects()
    const all = Array.isArray(res.data) ? res.data : (res.data?.results || [])
    projects.value = all.filter(item => item.type === 'PROJECT')
  } catch (err) {
    console.error('Failed to load projects', err)
  }
})

async function submit() {
  errorMsg.value = ''

  if (form.value.assignment_mode === 'DIRECT' && !form.value.assignee_id) {
    errorMsg.value = t('tasks.select_assignee_err')
    return
  }
  if (form.value.assignment_mode === 'CLAIM' && !form.value.eligible_employee_ids.length) {
    errorMsg.value = t('tasks.select_claimant_err')
    return
  }
  if (form.value.assignment_mode === 'REQUEST' && !form.value.request_employee_id) {
    errorMsg.value = t('tasks.select_request_err')
    return
  }

  submitting.value = true
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority,
      assignment_mode: form.value.assignment_mode,
      due_date: form.value.due_date || null,
      project_id: form.value.project_id || null,
      direct_assignee_id: form.value.assignee_id,
      allowed_claimant_ids: form.value.eligible_employee_ids,
      requested_employee_id: form.value.request_employee_id,
      creator_employee_id: authStore.currentEmployee?.outer_id || authStore.employee?.outer_id || null,
    }
    const { data } = await tasksApi.create(payload)
    toast.success(t('tasks.create_success'))
    router.push(`/tasks/${data.id}`)
  } catch (e) {
    const errData = e.response?.data
    if (errData && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0]
      const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]
      errorMsg.value = `${firstKey}: ${msg}`
    } else {
      errorMsg.value = e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || ''
    }
    if (errorMsg.value) toast.error(errorMsg.value)
  } finally {
    submitting.value = false
  }
}
</script>
