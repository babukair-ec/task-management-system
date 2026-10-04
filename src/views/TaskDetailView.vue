<template>
  <div v-if="loading" class="loading-spinner">
    <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
  </div>

  <div v-else-if="task">
    <!-- Header -->
    <div class="page-header d-flex align-items-start justify-content-between gap-3">
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <button class="btn btn-sm btn-tf-ghost" @click="$router.back()">
            <i class="bi bi-arrow-left"></i>
          </button>
          <TaskStatus :status="task.status" />
          <span :class="['status-badge', `priority-${task.priority?.toLowerCase()}`]">{{ task.priority }}</span>
        </div>
        <h1 class="page-title">{{ task.title }}</h1>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left: Task Info -->
      <div class="col-12 col-lg-7">
        <div class="tf-card mb-4">
          <div class="tf-card-header"><i class="bi bi-info-circle"></i>Task Details</div>

          <p v-if="task.description" class="mb-3" style="color:var(--tf-text-muted)">{{ task.description }}</p>
          <p v-else class="mb-3 text-muted fst-italic" style="font-size:0.85rem">No description provided.</p>

          <div class="row g-3" style="font-size:0.85rem">
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Creator</div>
              <div class="d-flex align-items-center gap-2">
                <div class="avatar">{{ initials(task.creator_detail || task.creator) }}</div>
                {{ task.creator_detail?.display_name || task.creator_detail?.username || task.creator?.full_name || task.creator?.username || task.creator_id }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Current Owner</div>
              <div v-if="task.current_owner_detail || task.owner" class="d-flex align-items-center gap-2">
                <div class="avatar">{{ initials(task.current_owner_detail || task.owner) }}</div>
                {{ task.current_owner_detail?.display_name || task.current_owner_detail?.username || task.owner?.full_name || task.owner?.username }}
              </div>
              <div v-else class="text-muted">Unassigned</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Mode</div>
              <div>{{ task.assignment_mode_display || task.assignment_mode || task.assignmentMode }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Due Date</div>
              <div>{{ formatDate(task.due_date) }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Created</div>
              <div>{{ formatDateTime(task.created_at || task.createdAt) }}</div>
            </div>
            <div class="col-6" v-if="task.started_at || task.startedAt">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Started</div>
              <div>{{ formatDateTime(task.started_at || task.startedAt) }}</div>
            </div>
            <div class="col-6" v-if="task.completed_at || task.completedAt">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">Completed</div>
              <div>{{ formatDateTime(task.completed_at || task.completedAt) }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="tf-card mb-4" v-if="availableActions.length">
          <div class="tf-card-header"><i class="bi bi-lightning"></i>Actions</div>
          <div class="d-flex flex-wrap gap-2">
            <!-- Start -->
            <button v-if="can('start')" class="btn btn-tf-primary btn-sm" @click="doAction('start')">
              <i class="bi bi-play me-1"></i>Start Task
            </button>
            <!-- Complete -->
            <button v-if="can('complete')" class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="doAction('complete')">
              <i class="bi bi-check-lg me-1"></i>Mark Complete
            </button>
            <!-- Cancel -->
            <button v-if="can('cancel')" class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.25)" @click="doAction('cancel')">
              <i class="bi bi-x-lg me-1"></i>Cancel Task
            </button>
            <!-- Claim -->
            <button v-if="can('claim')" class="btn btn-tf-primary btn-sm" @click="doAction('claim')">
              <i class="bi bi-hand-index me-1"></i>Claim Task
            </button>
            <!-- Reassign -->
            <button v-if="can('reassign')" class="btn btn-tf-ghost btn-sm" @click="showReassign = !showReassign">
              <i class="bi bi-arrow-repeat me-1"></i>Reassign
            </button>
            <!-- Report Problem -->
            <button v-if="can('report_problem')" class="btn btn-sm" style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3)" @click="showProblemForm = !showProblemForm">
              <i class="bi bi-exclamation-triangle me-1"></i>Report Problem
            </button>
          </div>

          <!-- Reassign form -->
          <div v-if="showReassign" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">Reassign Task</div>
            <EmployeeSelector v-model="reassignTo" placeholder="Select new owner…" :exclude-ids="[task.current_owner_id]" class="mb-2" />
            <input v-model="reassignReason" type="text" class="form-control tf-input mb-2" placeholder="Reason (optional)" />
            <div class="d-flex gap-2">
              <button class="btn btn-tf-primary btn-sm" :disabled="!reassignTo" @click="doReassign">Confirm</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showReassign = false">Cancel</button>
            </div>
          </div>

          <!-- Problem form -->
          <div v-if="showProblemForm" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">Report Problem (Blocks Task)</div>
            <textarea v-model="problemDesc" class="form-control tf-input mb-2" rows="3" placeholder="Describe the blocker…"></textarea>
            <div class="d-flex gap-2">
              <button class="btn btn-sm" style="background:var(--tf-warning);color:#000;font-weight:600" :disabled="!problemDesc.trim()" @click="doReportProblem">Submit Blocker</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showProblemForm = false">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Problems on this task -->
        <div class="tf-card mb-4" v-if="problems.length">
          <div class="tf-card-header"><i class="bi bi-exclamation-triangle text-danger"></i>Problems ({{ problems.length }})</div>
          <ProblemCard v-for="p in problems" :key="p.id" :problem="p" />
        </div>
      </div>

      <!-- Right: History -->
      <div class="col-12 col-lg-5">
        <div class="tf-card">
          <div class="tf-card-header"><i class="bi bi-clock-history"></i>Assignment History</div>
          <div v-if="history.length">
            <div v-for="h in history" :key="h.id" class="history-item">
              <div class="history-dot"></div>
              <div style="font-size:0.82rem">
                <div>
                  <span v-if="h.from_employee_detail">{{ h.from_employee_detail?.display_name || h.from_employee_detail?.username }} → </span>
                  <span class="fw-semibold">{{ h.to_employee_detail?.display_name || h.to_employee_detail?.username || 'Employee ' + h.to_employee_id }}</span>
                </div>
                <div v-if="h.reason" class="text-muted fst-italic">"{{ h.reason }}"</div>
                <div class="text-muted" style="font-size:0.72rem">{{ formatDateTime(h.created_at) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-muted small fst-italic">No reassignment history recorded.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import TaskStatus from '@/components/TaskStatus.vue'
import ProblemCard from '@/components/ProblemCard.vue'
import EmployeeSelector from '@/components/EmployeeSelector.vue'
import { formatDate, formatDateTime, initials } from '@/utils/formatters'

const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()

const task           = ref(null)
const problems       = ref([])
const history        = ref([])
const loading        = ref(true)
const showReassign   = ref(false)
const reassignTo     = ref(null)
const reassignReason = ref('')
const showProblemForm= ref(false)
const problemDesc    = ref('')

const currentEmployeeId = computed(() => auth.employee?.id || auth.user?.id)

const availableActions = computed(() => {
  if (!task.value) return []
  const actions = []
  const isOwner   = task.value.current_owner_id === currentEmployeeId.value || task.value.currentOwnerId === currentEmployeeId.value
  const isCreator = task.value.creator_id === currentEmployeeId.value || task.value.creatorId === currentEmployeeId.value

  if (task.value.status === 'AVAILABLE') {
    actions.push('claim')
  }
  if (isOwner && task.value.status === 'ASSIGNED') {
    actions.push('start')
  }
  if (isOwner && task.value.status === 'IN_PROGRESS') {
    actions.push('complete')
    actions.push('report_problem')
    actions.push('reassign')
  }
  if ((isOwner || isCreator) && !['COMPLETED', 'CANCELLED'].includes(task.value.status)) {
    actions.push('cancel')
  }
  return actions
})

function can(action) {
  return availableActions.value.includes(action)
}

async function load() {
  loading.value = true
  try {
    const id = route.params.id
    const [tRes, pRes] = await Promise.all([
      tasksApi.get(id),
      tasksApi.getProblems(id).catch(() => ({ data: [] })),
    ])
    task.value     = tRes.data
    problems.value = pRes.data || []
    history.value  = tRes.data?.history || []
  } catch {
    toast.error('Failed to load task details')
  } finally {
    loading.value = false
  }
}

async function doAction(action) {
  try {
    if (action === 'start')    await tasksApi.start(task.value.id)
    if (action === 'complete') await tasksApi.complete(task.value.id)
    if (action === 'cancel')   await tasksApi.cancel(task.value.id)
    if (action === 'claim')    await tasksApi.claim(task.value.id)
    toast.success(`Action applied successfully`)
    load()
  } catch (e) {
    toast.error(e.response?.data?.error || 'Action failed')
  }
}

async function doReassign() {
  try {
    await tasksApi.reassign(task.value.id, {
      new_owner_id: reassignTo.value,
      reason: reassignReason.value,
    })
    toast.success('Task reassigned!')
    showReassign.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.error || 'Reassignment failed')
  }
}

async function doReportProblem() {
  try {
    await tasksApi.reportProblem(task.value.id, { description: problemDesc.value })
    toast.success('Problem reported — task is now BLOCKED')
    showProblemForm.value = false
    problemDesc.value = ''
    load()
  } catch (e) {
    toast.error(e.response?.data?.error || 'Failed to report problem')
  }
}

onMounted(load)
</script>
