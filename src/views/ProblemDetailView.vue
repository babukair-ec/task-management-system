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
      <h1 class="page-title">Problem Details</h1>
      <RouterLink :to="`/tasks/${problem.task}`" class="text-muted small">
        <i class="bi bi-link-45deg me-1"></i>{{ problem.task_title || `Task #${problem.task}` }}
      </RouterLink>
    </div>

    <div class="tf-card mb-4">
      <div class="tf-card-header"><i class="bi bi-exclamation-triangle"></i>Problem</div>
      <p style="font-size:0.95rem">{{ problem.description }}</p>

      <div class="row g-3 mt-1" style="font-size:0.82rem">
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">Reported By</div>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar" style="width:22px;height:22px;font-size:0.55rem">{{ initials(problem.reported_by_detail) }}</div>
            {{ problem.reported_by_detail?.display_name || problem.reported_by_detail?.username || 'Employee #' + problem.reported_by }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">Resolver</div>
          <div v-if="problem.resolver_detail || problem.resolver" class="d-flex align-items-center gap-2">
            <div class="avatar" style="width:22px;height:22px;font-size:0.55rem">{{ initials(problem.resolver_detail) }}</div>
            {{ problem.resolver_detail?.display_name || problem.resolver_detail?.username || 'Employee #' + problem.resolver }}
          </div>
          <div v-else class="text-muted">Not assigned</div>
        </div>
        <div class="col-6">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">Reported</div>
          {{ formatDateTime(problem.created_at) }}
        </div>
        <div class="col-6" v-if="problem.resolved_at">
          <div class="text-muted mb-1" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em">Resolved</div>
          {{ formatDateTime(problem.resolved_at) }}
        </div>
      </div>

      <div v-if="problem.resolution" class="mt-3 p-3 rounded" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2)">
        <div class="text-success mb-1" style="font-size:0.75rem;font-weight:600;text-transform:uppercase">Resolution</div>
        <p class="mb-0" style="font-size:0.875rem">{{ problem.resolution }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="tf-card" v-if="availableActions.length">
      <div class="tf-card-header"><i class="bi bi-lightning"></i>Actions</div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <button v-if="can('assign_resolver')" class="btn btn-tf-ghost btn-sm" @click="showAssign = !showAssign">
          <i class="bi bi-person-check me-1"></i>Assign Resolver
        </button>
        <button v-if="can('resolve')" class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="showResolve = !showResolve">
          <i class="bi bi-check2-circle me-1"></i>Resolve Problem
        </button>
        <button v-if="can('cancel')" class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.25)" @click="doCancel">
          <i class="bi bi-x-lg me-1"></i>Cancel Problem
        </button>
      </div>

      <!-- Assign Resolver Form -->
      <div v-if="showAssign" class="p-3 rounded mb-3" style="background:var(--tf-surface-3)">
        <div class="tf-label mb-2">Assign Resolver</div>
        <EmployeeSelector v-model="resolverEmpId" placeholder="Select resolver…" />
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-tf-primary btn-sm" @click="doAssignResolver">Assign</button>
          <button class="btn btn-tf-ghost btn-sm" @click="showAssign = false">Cancel</button>
        </div>
      </div>

      <!-- Resolve Form -->
      <div v-if="showResolve" class="p-3 rounded" style="background:var(--tf-surface-3)">
        <div class="tf-label mb-2">Resolution Notes</div>
        <textarea v-model="resolutionText" class="form-control tf-input mb-2" rows="2" placeholder="Describe how the problem was resolved…"></textarea>
        <div class="d-flex gap-2">
          <button class="btn btn-sm" style="background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="doResolve">Resolve</button>
          <button class="btn btn-tf-ghost btn-sm" @click="showResolve = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <i class="bi bi-exclamation-circle"></i><p>Problem not found.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { problemsApi } from '@/api/problems'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { initials, formatDateTime } from '@/utils/formatters'
import TaskStatus from '@/components/TaskStatus.vue'
import EmployeeSelector from '@/components/EmployeeSelector.vue'

const props = defineProps({ id: { type: String, required: true } })
const auth  = useAuthStore()
const toast = useToast()

const problem = ref(null)
const loading = ref(true)
const showAssign  = ref(false)
const showResolve = ref(false)
const resolverEmpId  = ref(null)
const resolutionText = ref('')

const me = computed(() => auth.user)

function can(action) { return availableActions.value.includes(action) }

const availableActions = computed(() => {
  if (!problem.value) return []
  const s = problem.value.status
  const actions = []
  if (['OPEN', 'IN_PROGRESS'].includes(s)) actions.push('resolve', 'assign_resolver', 'cancel')
  return actions
})

async function load() {
  loading.value = true
  try {
    const { data } = await problemsApi.get(props.id)
    problem.value = data
  } catch { toast.error('Failed to load problem') }
  finally { loading.value = false }
}

async function doAssignResolver() {
  if (!resolverEmpId.value) return
  try {
    const { data } = await problemsApi.assignResolver(props.id, { resolver_id: resolverEmpId.value })
    problem.value = data
    showAssign.value = false
    resolverEmpId.value = null
    toast.success('Resolver assigned!')
  } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

async function doResolve() {
  if (!resolutionText.value.trim()) return
  try {
    const { data } = await problemsApi.resolve(props.id, { resolution: resolutionText.value })
    problem.value = data
    showResolve.value = false
    resolutionText.value = ''
    toast.success('Problem resolved! Task returned to IN_PROGRESS.')
  } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

async function doCancel() {
  try {
    const { data } = await problemsApi.cancel(props.id)
    problem.value = data
    toast.info('Problem cancelled')
  } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

onMounted(load)
</script>
