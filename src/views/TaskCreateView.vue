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
          <input v-model="form.title" id="task-title" type="text" class="form-control tf-input" placeholder="What needs to be done?" required />
        </div>

        <!-- Description -->
        <div class="mb-3">
          <label class="tf-label">{{ t('tasks.description') }}</label>
          <textarea v-model="form.description" id="task-description" class="form-control tf-input" rows="3" placeholder="Add more context…"></textarea>
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

        <!-- DIRECT: assignee -->
        <div v-if="form.assignment_mode === 'DIRECT'" class="mb-3">
          <label class="tf-label">{{ t('tasks.assignee') }} *</label>
          <EmployeeSelector v-model="form.assignee_id" placeholder="Search employee to assign…" />
        </div>

        <!-- CLAIM: eligible employees -->
        <div v-if="form.assignment_mode === 'CLAIM'" class="mb-3">
          <label class="tf-label">{{ t('tasks.allowed_employees') }} *</label>
          <EmployeeSelector v-model="form.eligible_employee_ids" :multiple="true" placeholder="Add eligible employees…" />
        </div>

        <!-- REQUEST: send request after creation -->
        <div v-if="form.assignment_mode === 'REQUEST'" class="mb-3">
          <label class="tf-label">{{ t('tasks.requested_from') }} *</label>
          <EmployeeSelector v-model="form.request_employee_id" placeholder="Who should perform this task?" />
          <p class="text-muted mt-1" style="font-size:0.75rem">A task request will be sent automatically after creation.</p>
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
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import EmployeeSelector from '@/components/EmployeeSelector.vue'

const router = useRouter()
const toast  = useToast()
const { t }  = useI18n()

const submitting = ref(false)
const errorMsg   = ref('')

const modes = computed(() => [
  { value: 'SELF',    icon: 'bi-person',       label: t('modes.SELF'),    desc: 'You create and will work on this task yourself.' },
  { value: 'DIRECT',  icon: 'bi-person-check', label: t('modes.DIRECT'),  desc: 'Assign directly to a specific colleague.' },
  { value: 'CLAIM',   icon: 'bi-broadcast',    label: t('modes.CLAIM'),   desc: 'Make task available for a group of colleagues to claim.' },
  { value: 'REQUEST', icon: 'bi-send',         label: t('modes.REQUEST'), desc: 'Request a colleague to take on this task.' },
])

const form = ref({
  title: '',
  description: '',
  priority: 'MEDIUM',
  assignment_mode: 'SELF',
  due_date: '',
  assignee_id: null,
  eligible_employee_ids: [],
  request_employee_id: null,
})

const currentMode = computed(() => modes.value.find(m => m.value === form.value.assignment_mode))

async function submit() {
  errorMsg.value = ''

  if (form.value.assignment_mode === 'DIRECT' && !form.value.assignee_id) {
    errorMsg.value = 'Please select an assignee.'
    return
  }
  if (form.value.assignment_mode === 'CLAIM' && !form.value.eligible_employee_ids.length) {
    errorMsg.value = 'Please select at least one eligible employee.'
    return
  }
  if (form.value.assignment_mode === 'REQUEST' && !form.value.request_employee_id) {
    errorMsg.value = 'Please select an employee to request from.'
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
      direct_assignee_id: form.value.assignee_id,
      allowed_claimant_ids: form.value.eligible_employee_ids,
      requested_employee_id: form.value.request_employee_id,
    }
    const { data } = await tasksApi.create(payload)
    toast.success('Task created successfully!')
    router.push(`/tasks/${data.id}`)
  } catch (e) {
    errorMsg.value = e.response?.data?.error || 'Failed to create task.'
    toast.error(errorMsg.value)
  } finally {
    submitting.value = false
  }
}
</script>
