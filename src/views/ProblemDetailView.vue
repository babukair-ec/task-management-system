<template>
  <div v-if="loading" class="loading-spinner">
    <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
  </div>

  <div v-else-if="problem" style="max-width:760px">
    <div class="page-header">
      <div class="d-flex align-items-center gap-2 mb-1">
        <button class="btn btn-sm btn-tf-ghost" @click="$router.back()"><i class="bi bi-arrow-left"></i></button>
        <TaskStatus :status="problem.status" />
      </div>
      <h1 class="page-title">{{ t('task_detail_view.problem_details') }}</h1>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <RouterLink v-if="problem.task" :to="`/tasks/${problem.task}`" class="text-muted small">
          <i class="bi bi-link-45deg me-1"></i>{{ problem.task_title || `Task #${problem.task}` }}
        </RouterLink>
        <span v-if="problem.project_id" class="badge bg-info-subtle text-info border border-info-subtle small">
          <i class="bi bi-kanban me-1"></i>{{ t('problems.project_problem') || 'Project Problem' }}: {{ problem.project_id }}
        </span>
      </div>
    </div>

    <!-- Resolution Task Banner if exists -->
    <div v-if="problem.resolution_task_id" class="alert alert-success d-flex align-items-center justify-content-between p-3 mb-4">
      <div>
        <i class="bi bi-check-circle me-2 text-success"></i>
        <strong>{{ t('problems.resolution_task_linked') || 'Resolution Task Created' }}:</strong>
        <span class="ms-1 font-monospace">Task #{{ problem.resolution_task_id }}</span>
      </div>
      <RouterLink :to="`/tasks/${problem.resolution_task_id}`" class="btn btn-sm btn-success text-white">
        <i class="bi bi-box-arrow-up-right me-1"></i>{{ t('problems.view_resolution_task') || 'Open Task' }}
      </RouterLink>
    </div>

    <div class="tf-card mb-4">
      <div class="tf-card-header"><i class="bi bi-exclamation-triangle"></i>{{ t('task_detail_view.problem') }}</div>
      <p style="font-size:0.95rem">{{ problem.description }}</p>

      <div class="row g-3 mt-1" style="font-size:0.82rem">
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.reported_by') }}</div>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar" style="width:22px;height:22px;font-size:0.55rem">{{ initials(problem.reported_by_detail) }}</div>
            {{ problem.reported_by_detail?.display_name || problem.reported_by_detail?.username || 'Employee #' + problem.reported_by }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.resolver') }}</div>
          <div v-if="problem.resolver_detail || problem.resolver" class="d-flex align-items-center gap-2">
            <div class="avatar" style="width:22px;height:22px;font-size:0.55rem">{{ initials(problem.resolver_detail) }}</div>
            {{ problem.resolver_detail?.display_name || problem.resolver_detail?.username || 'Employee #' + problem.resolver }}
          </div>
          <div v-else class="text-muted">{{ t('task_detail_view.not_assigned') }}</div>
        </div>
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.reported') }}</div>
          {{ formatDateTime(problem.created_at) }}
        </div>
        <div class="col-6" v-if="problem.resolved_at">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.resolved') }}</div>
          {{ formatDateTime(problem.resolved_at) }}
        </div>
      </div>

      <div v-if="problem.resolution" class="mt-3 p-3 rounded" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2)">
        <div class="text-success mb-1" style="font-size:0.75rem;font-weight:600;text-transform:uppercase">{{ t('task_detail_view.solution') }}</div>
        <p class="mb-0" style="font-size:0.875rem">{{ problem.resolution }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="tf-card" v-if="availableActions.length">
      <div class="tf-card-header"><i class="bi bi-lightning"></i>{{ t('tasks.actions') }}</div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <button v-if="can('create_resolution_task')" class="btn btn-tf-primary btn-sm" @click="showResolutionTaskModal = !showResolutionTaskModal">
          <i class="bi bi-plus-square me-1"></i>{{ t('problems.create_resolution_task') || 'Create Resolution Task' }}
        </button>
        <button v-if="can('assign_resolver')" class="btn btn-tf-ghost btn-sm" @click="showAssign = !showAssign">
          <i class="bi bi-person-check me-1"></i>{{ t('problems.assign_resolver') }}
        </button>
        <button v-if="can('resolve')" class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="showResolve = !showResolve">
          <i class="bi bi-check2-circle me-1"></i>{{ t('problems.resolve_problem') }}
        </button>
        <button v-if="can('cancel')" class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.25)" @click="doCancel">
          <i class="bi bi-x-lg me-1"></i>{{ t('problems.cancel_problem') }}
        </button>
      </div>

      <!-- Create Resolution Task Form -->
      <div v-if="showResolutionTaskModal" class="p-3 rounded mb-3" style="background:var(--tf-surface-3)">
        <div class="tf-label mb-2">{{ t('problems.create_resolution_task') || 'Create Resolution Task' }}</div>
        <input v-model="resTaskTitle" type="text" class="form-control tf-input mb-2" :placeholder="t('tasks.task_title') || 'Resolution Task Title'" />
        <EmployeeSelector v-model="resTaskAssigneeId" :placeholder="t('tasks.assignee_placeholder') || 'Select Assignee (Optional)'" class="mb-2" />
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-tf-primary btn-sm" :disabled="!resTaskTitle.trim()" @click="doCreateResolutionTask">{{ t('common.save') }}</button>
          <button class="btn btn-tf-ghost btn-sm" @click="showResolutionTaskModal = false">{{ t('common.cancel') }}</button>
        </div>
      </div>

      <!-- Assign Resolver Form -->
      <div v-if="showAssign" class="p-3 rounded mb-3" style="background:var(--tf-surface-3)">
        <div class="tf-label mb-2">{{ t('problems.assign_resolver') }}</div>
        <EmployeeSelector v-model="resolverEmpId" :placeholder="t('problems.select_resolver')" />
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-tf-primary btn-sm" @click="doAssignResolver">{{ t('common.save') }}</button>
          <button class="btn btn-tf-ghost btn-sm" @click="showAssign = false">{{ t('common.cancel') }}</button>
        </div>
      </div>

      <!-- Resolve Form -->
      <div v-if="showResolve" class="p-3 rounded" style="background:var(--tf-surface-3)">
        <div class="tf-label mb-2">{{ t('task_detail_view.solution') }}</div>
        <textarea v-model="resolutionText" class="form-control tf-input mb-2" rows="2" :placeholder="t('problems.resolution_placeholder')"></textarea>
        <div class="d-flex gap-2">
          <button class="btn btn-sm" style="background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="doResolve">{{ t('problems.confirm_resolve') }}</button>
          <button class="btn btn-tf-ghost btn-sm" @click="showResolve = false">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <i class="bi bi-exclamation-circle"></i><p>{{ t('problems.not_found') }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { problemsApi } from '@/api/problems'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { initials, formatDateTime } from '@/utils/formatters'
import TaskStatus from '@/components/TaskStatus.vue'
import EmployeeSelector from '@/components/EmployeeSelector.vue'

const props = defineProps({ id: { type: String, required: true } })
const auth  = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const problem = ref(null)
const loading = ref(true)
const showAssign  = ref(false)
const showResolve = ref(false)
const showResolutionTaskModal = ref(false)
const resTaskTitle = ref('')
const resTaskAssigneeId = ref(null)
const resolverEmpId  = ref(null)
const resolutionText = ref('')

const me = computed(() => auth.user)

function can(action) { return availableActions.value.includes(action) }

const availableActions = computed(() => {
  if (!problem.value) return []
  const s = problem.value.status
  const actions = []
  if (['OPEN', 'IN_PROGRESS'].includes(s)) {
    actions.push('resolve', 'assign_resolver', 'cancel')
    if (problem.value.project_id && !problem.value.resolution_task_id) {
      actions.push('create_resolution_task')
    }
  }
  return actions
})

async function doCreateResolutionTask() {
  if (!resTaskTitle.value.trim()) return
  try {
    await problemsApi.createResolutionTask(props.id, {
      title: resTaskTitle.value.trim(),
      assignee_id: resTaskAssigneeId.value,
    })
    toast.success(t('problems.resolution_task_created_success') || 'Resolution task created successfully')
    showResolutionTaskModal.value = false
    resTaskTitle.value = ''
    resTaskAssigneeId.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to create resolution task')
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await problemsApi.get(props.id)
    problem.value = data
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to load problem')
  } finally {
    loading.value = false
  }
}

async function doAssignResolver() {
  if (!resolverEmpId.value) return
  try {
    const { data } = await problemsApi.assignResolver(props.id, { resolver_id: resolverEmpId.value })
    problem.value = data
    showAssign.value = false
    resolverEmpId.value = null
    toast.success(t('problems.resolver_assigned_success'))
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

async function doResolve() {
  if (!resolutionText.value.trim()) return
  try {
    const { data } = await problemsApi.resolve(props.id, { resolution: resolutionText.value })
    problem.value = data
    showResolve.value = false
    resolutionText.value = ''
    toast.success(t('problems.problem_resolved_success'))
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

async function doCancel() {
  try {
    const { data } = await problemsApi.cancel(props.id)
    problem.value = data
    toast.info(t('problems.problem_cancelled_success'))
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

onMounted(load)
</script>
