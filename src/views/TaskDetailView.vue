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
          <div class="tf-card-header"><i class="bi bi-info-circle"></i>{{ t('task_detail_view.task_details') }}</div>

          <p v-if="task.description" class="mb-3" style="color:var(--tf-text-muted)">{{ task.description }}</p>
          <p v-else class="mb-3 text-muted fst-italic" style="font-size:0.85rem">{{ t('task_detail_view.no_description') }}</p>

          <div class="row g-3" style="font-size:0.85rem">
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.creator') }}</div>
              <div class="d-flex align-items-center gap-2">
                <div class="avatar">{{ initials(task.creator_detail || task.creator) }}</div>
                {{ task.creator_detail?.display_name || task.creator_detail?.username || task.creator?.full_name || task.creator?.username || task.creator_id }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.current_owner') }}</div>
              <div v-if="task.current_owner_detail || task.owner" class="d-flex align-items-center gap-2">
                <div class="avatar">{{ initials(task.current_owner_detail || task.owner) }}</div>
                {{ task.current_owner_detail?.display_name || task.current_owner_detail?.username || task.owner?.full_name || task.owner?.username }}
              </div>
              <div v-else class="text-muted">{{ t('task_detail_view.unassigned') }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.mode') }}</div>
              <div>{{ task.assignment_mode_display || task.assignment_mode || task.assignmentMode }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('task_detail_view.due_date') }}</div>
              <div>{{ formatDate(task.due_date) }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('tasks.created') }}</div>
              <div>{{ formatDateTime(task.created_at || task.createdAt) }}</div>
            </div>
            <div class="col-6" v-if="task.project || task.project_id">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('tasks.project') || 'Project' }}</div>
              <div>
                <span class="badge bg-info-subtle text-info border border-info-subtle">
                  <i class="bi bi-kanban me-1"></i>{{ task.project?.name || task.project_name || 'Project' }}
                </span>
              </div>
            </div>
            <div class="col-6" v-if="task.reviewer_detail || task.reviewer_id || task.reviewer">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('tasks.reviewer') || 'Reviewer' }}</div>
              <div class="d-flex align-items-center gap-2">
                <div class="avatar">{{ initials(task.reviewer_detail || task.reviewer) }}</div>
                {{ task.reviewer_detail?.display_name || task.reviewer_detail?.username || task.reviewer?.full_name || task.reviewer_id }}
              </div>
            </div>
            <div class="col-6" v-if="task.reviewed_at">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('tasks.reviewed_at') || 'Reviewed At' }}</div>
              <div>{{ formatDateTime(task.reviewed_at) }}</div>
            </div>
            <div class="col-12" v-if="task.review_comment">
              <div class="text-muted mb-1" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">{{ t('tasks.review_comment') || 'Review Note' }}</div>
              <div class="p-2 rounded bg-surface border text-muted small fst-italic">"{{ task.review_comment }}"</div>
            </div>
            <div class="col-12" v-if="task.problem_id">
              <div class="alert alert-warning py-2 mb-0 small d-flex align-items-center justify-content-between">
                <div>
                  <i class="bi bi-tools me-1"></i>
                  <strong>{{ t('tasks.resolution_task_badge') || 'Resolution Task' }}</strong>
                  — {{ t('tasks.resolves_problem') || 'Resolving problem' }} #{{ task.problem_id }}
                </div>
                <RouterLink :to="`/problems/${task.problem_id}`" class="btn btn-xs btn-outline-dark">
                  {{ t('tasks.view_problem') || 'View Problem' }}
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="tf-card mb-4" v-if="availableActions.length">
          <div class="tf-card-header"><i class="bi bi-lightning"></i>{{ t('tasks.actions') }}</div>
          <div class="d-flex flex-wrap gap-2">
            <!-- Start -->
            <button v-if="can('start')" class="btn btn-tf-primary btn-sm" @click="doAction('start')">
              <i class="bi bi-play me-1"></i>{{ t('tasks.start_btn') }}
            </button>
            <!-- Submit for Review -->
            <button v-if="can('submit_review')" class="btn btn-tf-primary btn-sm" @click="doSubmitReview">
              <i class="bi bi-send-check me-1"></i>{{ t('tasks.submit_for_review') || 'Submit for Review' }}
            </button>
            <!-- Review -->
            <button v-if="can('review')" class="btn btn-sm btn-warning text-dark fw-semibold" @click="showReviewForm = !showReviewForm">
              <i class="bi bi-shield-check me-1"></i>{{ t('tasks.review_btn') || 'Review Task' }}
            </button>
            <!-- Start Test (for tester) -->
            <button v-if="can('start_test')" class="btn btn-sm btn-info text-white" @click="doStartTest">
              <i class="bi bi-play-circle me-1"></i>{{ t('tasks.start_test_btn') || 'Start Test' }}
            </button>
            <!-- Complete Test -->
            <button v-if="can('complete_test')" class="btn btn-sm btn-outline-info" @click="showTestForm = !showTestForm">
              <i class="bi bi-check2-circle me-1"></i>{{ t('tasks.record_test_result') || 'Record Test Result' }}
            </button>
            <!-- Complete (legacy if in progress) -->
            <button v-if="can('complete')" class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3)" @click="doAction('complete')">
              <i class="bi bi-check-lg me-1"></i>{{ t('tasks.complete_btn') }}
            </button>
            <!-- Cancel -->
            <button v-if="can('cancel')" class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.25)" @click="doAction('cancel')">
              <i class="bi bi-x-lg me-1"></i>{{ t('tasks.cancel_task_btn') }}
            </button>
            <!-- Claim -->
            <button v-if="can('claim')" class="btn btn-tf-primary btn-sm" @click="doAction('claim')">
              <i class="bi bi-hand-index me-1"></i>{{ t('tasks.claim_btn') }}
            </button>
            <!-- Reassign -->
            <button v-if="can('reassign')" class="btn btn-tf-ghost btn-sm" @click="showReassign = !showReassign">
              <i class="bi bi-arrow-repeat me-1"></i>{{ t('tasks.reassign_btn') }}
            </button>
            <!-- Report Problem -->
            <button v-if="can('report_problem')" class="btn btn-sm" style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3)" @click="showProblemForm = !showProblemForm">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ t('tasks.report_problem_btn') }}
            </button>
          </div>

          <!-- Review form -->
          <div v-if="showReviewForm" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">{{ t('tasks.task_review_title') || 'Task Review Decision' }}</div>
            <div class="d-flex gap-2 mb-2">
              <button type="button" :class="['btn btn-sm', reviewDecision === 'APPROVED' ? 'btn-success' : 'btn-outline-success']" @click="reviewDecision = 'APPROVED'">
                <i class="bi bi-check-circle me-1"></i>{{ t('tasks.approve') || 'Approve' }}
              </button>
              <button type="button" :class="['btn btn-sm', reviewDecision === 'REJECTED' ? 'btn-danger' : 'btn-outline-danger']" @click="reviewDecision = 'REJECTED'">
                <i class="bi bi-x-circle me-1"></i>{{ t('tasks.reject') || 'Reject' }}
              </button>
            </div>
            <textarea v-model="reviewComment" class="form-control tf-input mb-2" rows="2" :placeholder="t('tasks.review_comment_placeholder') || 'Reviewer notes or reason for rejection...'"></textarea>
            <div class="d-flex gap-2">
              <button class="btn btn-tf-primary btn-sm" :disabled="!reviewComment && reviewDecision === 'REJECTED'" @click="doReview">{{ t('common.confirm') }}</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showReviewForm = false">{{ t('common.cancel') }}</button>
            </div>
          </div>

          <!-- Test form -->
          <div v-if="showTestForm" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">{{ t('tasks.test_result_title') || 'Testing Result' }}</div>
            <div class="d-flex gap-2 mb-2">
              <button type="button" :class="['btn btn-sm', testResult === 'PASSED' ? 'btn-success' : 'btn-outline-success']" @click="testResult = 'PASSED'">
                <i class="bi bi-check-all me-1"></i>{{ t('tasks.pass_test') || 'Passed' }}
              </button>
              <button type="button" :class="['btn btn-sm', testResult === 'FAILED' ? 'btn-danger' : 'btn-outline-danger']" @click="testResult = 'FAILED'">
                <i class="bi bi-exclamation-octagon me-1"></i>{{ t('tasks.fail_test') || 'Failed' }}
              </button>
            </div>
            <textarea v-model="testNotes" class="form-control tf-input mb-2" rows="2" :placeholder="t('tasks.test_notes_placeholder') || 'Testing notes and findings...'"></textarea>
            <div class="d-flex gap-2">
              <button class="btn btn-tf-primary btn-sm" @click="doCompleteTest">{{ t('common.confirm') }}</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showTestForm = false">{{ t('common.cancel') }}</button>
            </div>
          </div>

          <!-- Reassign form -->
          <div v-if="showReassign" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">{{ t('tasks.reassign_modal_title') }}</div>
            <EmployeeSelector v-model="reassignTo" :placeholder="t('tasks.select_new_owner')" :exclude-ids="[task.current_owner_id]" class="mb-2" />
            <input v-model="reassignReason" type="text" class="form-control tf-input mb-2" :placeholder="t('tasks.reassign_reason')" />
            <div class="d-flex gap-2">
              <button class="btn btn-tf-primary btn-sm" :disabled="!reassignTo" @click="doReassign">{{ t('common.confirm') }}</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showReassign = false">{{ t('common.cancel') }}</button>
            </div>
          </div>

          <!-- Problem form -->
          <div v-if="showProblemForm" class="mt-3 p-3 rounded" style="background:var(--tf-surface-3)">
            <div class="fw-semibold mb-2" style="font-size:0.875rem">{{ t('tasks.report_problem_title') }}</div>
            <textarea v-model="problemDesc" class="form-control tf-input mb-2" rows="3" :placeholder="t('tasks.problem_placeholder')"></textarea>
            <div class="d-flex gap-2">
              <button class="btn btn-sm" style="background:var(--tf-warning);color:#000;font-weight:600" :disabled="!problemDesc.trim()" @click="doReportProblem">{{ t('tasks.submit_problem') }}</button>
              <button class="btn btn-tf-ghost btn-sm" @click="showProblemForm = false">{{ t('common.cancel') }}</button>
            </div>
          </div>
        </div>

        <!-- Problems on this task -->
        <div class="tf-card mb-4" v-if="problems.length">
          <div class="tf-card-header"><i class="bi bi-exclamation-triangle text-danger"></i>{{ t('task_detail_view.problems') }} ({{ problems.length }})</div>
          <ProblemCard v-for="p in problems" :key="p.id" :problem="p" />
        </div>
      </div>

      <!-- Right: Audit Histories -->
      <div class="col-12 col-lg-5">
        <!-- Review Audit History -->
        <div class="tf-card mb-4" v-if="task.reviews?.length || task.review_history?.length">
          <div class="tf-card-header"><i class="bi bi-shield-check text-warning"></i>{{ t('tasks.review_history') || 'Review History' }}</div>
          <div v-for="r in (task.reviews || task.review_history)" :key="r.id" class="p-2 mb-2 rounded bg-surface border small">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span :class="['badge', r.decision === 'APPROVED' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                {{ r.decision }}
              </span>
              <span class="text-muted" style="font-size:0.7rem">{{ formatDateTime(r.created_at || r.reviewed_at) }}</span>
            </div>
            <div v-if="r.comment" class="fst-italic text-muted">"{{ r.comment }}"</div>
          </div>
        </div>

        <!-- Testing Audit History -->
        <div class="tf-card mb-4" v-if="task.test_audits?.length || task.testing_audits?.length">
          <div class="tf-card-header"><i class="bi bi-patch-check text-info"></i>{{ t('tasks.testing_history') || 'Testing History' }}</div>
          <div v-for="a in (task.test_audits || task.testing_audits)" :key="a.id" class="p-2 mb-2 rounded bg-surface border small">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span :class="['badge', a.result === 'PASSED' ? 'bg-success-subtle text-success' : (a.result === 'FAILED' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info')]">
                {{ a.result || 'IN PROGRESS' }}
              </span>
              <span class="text-muted" style="font-size:0.7rem">{{ formatDateTime(a.completed_at || a.started_at) }}</span>
            </div>
            <div v-if="a.notes" class="fst-italic text-muted">"{{ a.notes }}"</div>
          </div>
        </div>

        <!-- Assignment History -->
        <div class="tf-card">
          <div class="tf-card-header"><i class="bi bi-clock-history"></i>{{ t('task_detail_view.history') }}</div>
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
          <div v-else class="text-muted small fst-italic">{{ t('task_detail_view.no_history') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { formatDate, formatDateTime, initials } from '@/utils/formatters'

const TaskStatus = defineAsyncComponent(() => import('@/components/TaskStatus.vue'))
const ProblemCard = defineAsyncComponent(() => import('@/components/ProblemCard.vue'))
const EmployeeSelector = defineAsyncComponent(() => import('@/components/EmployeeSelector.vue'))

const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()
const { t }  = useI18n()

const task           = ref(null)
const problems       = ref([])
const history        = ref([])
const loading        = ref(true)
const showReassign   = ref(false)
const reassignTo     = ref(null)
const reassignReason = ref('')
const showProblemForm= ref(false)
const problemDesc    = ref('')

const showReviewForm = ref(false)
const reviewDecision = ref('APPROVED')
const reviewComment  = ref('')

const showTestForm   = ref(false)
const testResult     = ref('PASSED')
const testNotes      = ref('')

const currentEmployeeId = computed(() => auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id)

const availableActions = computed(() => {
  if (!task.value) return []
  const actions = []
  const isOwner   = task.value.current_owner_id === currentEmployeeId.value || task.value.currentOwnerId === currentEmployeeId.value
  const isCreator = task.value.creator_id === currentEmployeeId.value || task.value.creatorId === currentEmployeeId.value
  const isTester  = auth.employee?.employee_type === 'TESTER' || auth.user?.employee_type === 'TESTER'

  if (task.value.status === 'AVAILABLE') {
    actions.push('claim')
  }
  if (isOwner && task.value.status === 'ASSIGNED') {
    actions.push('start')
  }
  if (isOwner && task.value.status === 'IN_PROGRESS') {
    actions.push('submit_review')
    actions.push('complete')
    actions.push('report_problem')
    actions.push('reassign')
  }
  if (task.value.status === 'PENDING_REVIEW') {
    actions.push('review')
  }
  if (task.value.status === 'TESTING' && isTester) {
    actions.push('start_test')
    actions.push('complete_test')
  }
  if ((isOwner || isCreator) && !['COMPLETED', 'CANCELLED', 'CLOSED'].includes(task.value.status)) {
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
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to load task details')
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
    toast.success(t('tasks.action_success'))
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Action failed')
  }
}

async function doSubmitReview() {
  try {
    await tasksApi.submitForReview(task.value.id)
    toast.success(t('tasks.submitted_for_review_success') || 'Task submitted for review')
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to submit for review')
  }
}

async function doReview() {
  try {
    await tasksApi.review(task.value.id, {
      decision: reviewDecision.value,
      review_comment: reviewComment.value,
    })
    toast.success(t('tasks.review_completed_success') || 'Review completed successfully')
    showReviewForm.value = false
    reviewComment.value = ''
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Review action failed')
  }
}

async function doStartTest() {
  try {
    await tasksApi.startTest(task.value.id)
    toast.success(t('tasks.test_started_success') || 'Testing started')
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to start testing')
  }
}

async function doCompleteTest() {
  try {
    await tasksApi.completeTest(task.value.id, {
      result: testResult.value,
      notes: testNotes.value,
    })
    toast.success(t('tasks.test_recorded_success') || 'Test result recorded')
    showTestForm.value = false
    testNotes.value = ''
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to record test result')
  }
}

async function doReassign() {
  try {
    await tasksApi.reassign(task.value.id, {
      new_owner_id: reassignTo.value,
      reason: reassignReason.value,
    })
    toast.success(t('tasks.reassign_success'))
    showReassign.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Reassignment failed')
  }
}

async function doReportProblem() {
  try {
    await tasksApi.reportProblem(task.value.id, { description: problemDesc.value })
    toast.success(t('tasks.problem_reported_success'))
    showProblemForm.value = false
    problemDesc.value = ''
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to report problem')
  }
}

onMounted(load)
</script>
