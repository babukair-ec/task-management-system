<template>
  <div>
    <!-- Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <div>
        <h1 class="page-title d-flex align-items-center gap-2">
          <i class="bi bi-diagram-3 text-primary"></i>
          {{ t('supervision.title') || 'Supervision & Organizational Governance' }}
        </h1>
        <p class="page-subtitle mb-0">
          {{ t('supervision.subtitle') || 'Manage supervision hierarchy, transfer approvals, relinquishing authority, and escalation.' }}
        </p>
      </div>
      <button class="btn btn-sm btn-tf-primary" @click="showNewRequestModal = true">
        <i class="bi bi-plus-lg me-1"></i>
        {{ t('supervision.new_request') || 'New Supervision Request' }}
      </button>
    </div>

    <!-- Tabs Navigation -->
    <ul class="nav nav-pills mb-4 gap-2">
      <li class="nav-item">
        <button
          type="button"
          :class="['nav-link btn-sm py-2 px-3', activeTab === 'hierarchy' ? 'active btn-tf-primary' : 'btn-tf-ghost text-muted']"
          @click="activeTab = 'hierarchy'"
        >
          <i class="bi bi-diagram-3 me-1"></i>{{ t('supervision.tab_hierarchy') || 'My Supervision Hierarchy' }}
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          :class="['nav-link btn-sm py-2 px-3', activeTab === 'incoming' ? 'active btn-tf-primary' : 'btn-tf-ghost text-muted']"
          @click="activeTab = 'incoming'"
        >
          <i class="bi bi-inbox me-1"></i>{{ t('supervision.tab_incoming') || 'Incoming Requests' }}
          <span v-if="incomingRequests.length" class="badge bg-danger ms-1">{{ incomingRequests.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          :class="['nav-link btn-sm py-2 px-3', activeTab === 'outgoing' ? 'active btn-tf-primary' : 'btn-tf-ghost text-muted']"
          @click="activeTab = 'outgoing'"
        >
          <i class="bi bi-send me-1"></i>{{ t('supervision.tab_outgoing') || 'My Sent Requests' }}
          <span v-if="outgoingRequests.length" class="badge bg-secondary ms-1">{{ outgoingRequests.length }}</span>
        </button>
      </li>
    </ul>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('common.loading') }}</div>
    </div>

    <!-- TAB 1: Hierarchy -->
    <div v-else-if="activeTab === 'hierarchy'">
      <div class="row g-4">
        <!-- Direct Supervisor Card -->
        <div class="col-12 col-md-6">
          <div class="tf-card h-100 p-4 border">
            <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-person-up text-primary"></i>
              {{ t('supervision.my_supervisor') || 'Direct Supervisor' }}
            </h5>
            <div v-if="hierarchy.supervisor" class="d-flex align-items-center gap-3 p-3 rounded bg-surface border">
              <div class="avatar bg-primary-subtle text-primary fs-5" style="width:48px;height:48px">
                {{ initials(hierarchy.supervisor) }}
              </div>
              <div>
                <h6 class="mb-0 fw-bold">{{ hierarchy.supervisor.full_name || hierarchy.supervisor.username }}</h6>
                <div class="text-muted small">{{ hierarchy.supervisor.job_title || 'Supervisor' }}</div>
                <div class="text-muted small font-monospace">{{ hierarchy.supervisor.email }}</div>
              </div>
            </div>
            <div v-else class="text-muted small fst-italic p-3 rounded bg-surface border">
              <i class="bi bi-info-circle me-1"></i>
              {{ t('supervision.no_supervisor') || 'You currently have no direct supervisor (Top-level / Root).' }}
            </div>

            <!-- Upward Chain -->
            <div v-if="hierarchy.upward_chain?.length" class="mt-4 pt-3 border-top">
              <h6 class="small fw-bold text-muted mb-2 text-uppercase">{{ t('supervision.upward_chain') || 'Chain of Command (Upwards)' }}</h6>
              <div class="d-flex flex-column gap-2">
                <div v-for="(sup, idx) in hierarchy.upward_chain" :key="sup.outer_id || sup.id" class="small d-flex align-items-center gap-2">
                  <span class="badge bg-secondary-subtle text-secondary font-monospace">L+{{ idx + 1 }}</span>
                  <span class="fw-semibold">{{ sup.full_name || sup.username }}</span>
                  <span class="text-muted">({{ sup.job_title || 'Manager' }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Direct Subordinates Card -->
        <div class="col-12 col-md-6">
          <div class="tf-card h-100 p-4 border">
            <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-people text-success"></i>
              {{ t('supervision.my_subordinates') || 'Direct Subordinates' }}
              <span class="badge bg-success-subtle text-success ms-auto small">{{ hierarchy.subordinates?.length || 0 }}</span>
            </h5>
            <div v-if="hierarchy.subordinates?.length" class="d-flex flex-column gap-2">
              <div v-for="sub in hierarchy.subordinates" :key="sub.outer_id || sub.id" class="d-flex align-items-center justify-content-between p-3 rounded bg-surface border">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar bg-success-subtle text-success" style="width:38px;height:38px">
                    {{ initials(sub) }}
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold">{{ sub.full_name || sub.username }}</h6>
                    <div class="text-muted small">{{ sub.job_title || 'Team Member' }}</div>
                  </div>
                </div>
                <span class="badge bg-light text-secondary border font-monospace">{{ sub.employee_type || 'EMPLOYEE' }}</span>
              </div>
            </div>
            <div v-else class="text-muted small fst-italic p-3 rounded bg-surface border">
              <i class="bi bi-info-circle me-1"></i>
              {{ t('supervision.no_subordinates') || 'No employees currently report to you.' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Incoming Requests -->
    <div v-else-if="activeTab === 'incoming'">
      <div v-if="incomingRequests.length === 0" class="tf-card text-center py-5">
        <i class="bi bi-inbox text-muted" style="font-size:3rem"></i>
        <h5 class="mt-3 text-muted">{{ t('supervision.no_incoming') || 'No pending incoming requests' }}</h5>
      </div>
      <div v-else class="row g-3">
        <div v-for="req in incomingRequests" :key="req.id" class="col-12">
          <div class="tf-card p-3 border d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span :class="['badge', req.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-secondary']">
                  {{ req.status }}
                </span>
                <span class="text-muted small font-monospace">{{ formatDateTime(req.created_at) }}</span>
                <span v-if="req.escalated_to" class="badge bg-info-subtle text-info border">
                  {{ t('supervision.escalated_badge') || 'Escalated' }}
                </span>
              </div>
              <h6 class="fw-bold mb-1">
                {{ req.requester_name || 'Requester' }}
                <span class="text-muted fw-normal mx-1">→</span>
                <span class="text-primary">{{ req.target_employee_name || 'Target Employee' }}</span>
              </h6>
              <p class="text-muted small mb-0">
                <strong>{{ t('supervision.proposed_supervisor') || 'Requested Supervisor' }}:</strong>
                {{ req.requested_supervisor_name || 'Self/Requester' }}
                <span v-if="req.reason" class="ms-2 fst-italic text-secondary">"{{ req.reason }}"</span>
              </p>
            </div>

            <!-- Action buttons -->
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-success text-white" @click="approveRequest(req.id)" :disabled="actionLoading === req.id">
                <i class="bi bi-check-lg me-1"></i>{{ t('common.approve') || 'Approve Transfer' }}
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="openRejectModal(req)" :disabled="actionLoading === req.id">
                <i class="bi bi-x-lg me-1"></i>{{ t('common.reject') || 'Reject' }}
              </button>
              <button class="btn btn-sm btn-outline-warning" @click="openEscalateModal(req)" :disabled="actionLoading === req.id">
                <i class="bi bi-arrow-up-right me-1"></i>{{ t('supervision.escalate') || 'Escalate' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Outgoing Requests -->
    <div v-else-if="activeTab === 'outgoing'">
      <div v-if="outgoingRequests.length === 0" class="tf-card text-center py-5">
        <i class="bi bi-send text-muted" style="font-size:3rem"></i>
        <h5 class="mt-3 text-muted">{{ t('supervision.no_outgoing') || 'You have not submitted any supervision requests' }}</h5>
      </div>
      <div v-else class="row g-3">
        <div v-for="req in outgoingRequests" :key="req.id" class="col-12">
          <div class="tf-card p-3 border d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span :class="['badge', req.status === 'PENDING' ? 'bg-warning text-dark' : (req.status === 'APPROVED' ? 'bg-success' : 'bg-secondary')]">
                  {{ req.status }}
                </span>
                <span class="text-muted small font-monospace">{{ formatDateTime(req.created_at) }}</span>
              </div>
              <h6 class="fw-bold mb-1">
                {{ t('supervision.target') || 'Target' }}: <span class="text-primary">{{ req.target_employee_name || req.target_employee }}</span>
              </h6>
              <p class="text-muted small mb-0">
                <strong>{{ t('supervision.approver') || 'Current Approver' }}:</strong>
                {{ req.current_approver_name || 'Hierarchy Authority' }}
                <span v-if="req.reason" class="ms-2 fst-italic text-secondary">"{{ req.reason }}"</span>
              </p>
            </div>

            <div v-if="req.status === 'PENDING'">
              <button class="btn btn-sm btn-tf-ghost text-danger" @click="cancelRequest(req.id)" :disabled="actionLoading === req.id">
                <i class="bi bi-trash me-1"></i>{{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Request Modal -->
    <div v-if="showNewRequestModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="showNewRequestModal = false">
      <div class="modal-dialog modal-dialog-centered" style="max-width:540px">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-person-plus text-primary me-2"></i>
              {{ t('supervision.create_modal_title') || 'Create Supervision Request' }}
            </h5>
            <button type="button" class="btn-close" @click="showNewRequestModal = false"></button>
          </div>
          <form @submit.prevent="submitNewRequest">
            <div class="modal-body p-3">
              <div class="mb-3">
                <label class="tf-label">{{ t('supervision.request_type') || 'Request Mode' }} <span class="text-danger">*</span></label>
                <select v-model="newReq.type" class="form-select tf-input">
                  <option value="SUPERVISE">{{ t('supervision.mode_supervise') || 'I want to supervise an employee (Claim Subordinate)' }}</option>
                  <option value="BE_SUPERVISED">{{ t('supervision.mode_be_supervised') || 'I want to be supervised by an employee' }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('supervision.target_employee') || 'Target Employee' }} <span class="text-danger">*</span></label>
                <EmployeeSelector v-model="newReq.target_employee_id" :placeholder="t('supervision.select_target') || 'Select target employee'" />
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('supervision.reason') || 'Justification / Reason' }}</label>
                <textarea v-model="newReq.reason" class="form-control tf-input" rows="2" :placeholder="t('supervision.reason_placeholder') || 'Explain the business requirement for this supervision change...'"></textarea>
              </div>
            </div>
            <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-tf-ghost" @click="showNewRequestModal = false">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-sm btn-tf-primary" :disabled="!newReq.target_employee_id || submittingReq">
                <span v-if="submittingReq" class="spinner-border spinner-border-sm me-1"></span>
                {{ t('common.submit') || 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="showRejectModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold text-danger">
              <i class="bi bi-x-circle me-2"></i>{{ t('supervision.reject_modal_title') || 'Reject Supervision Request' }}
            </h5>
            <button type="button" class="btn-close" @click="showRejectModal = false"></button>
          </div>
          <div class="modal-body p-3">
            <label class="tf-label">{{ t('supervision.rejection_reason') || 'Reason for Rejection' }}</label>
            <textarea v-model="rejectReason" class="form-control tf-input" rows="3" :placeholder="t('supervision.rejection_placeholder') || 'State why this request cannot be approved...'"></textarea>
          </div>
          <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-tf-ghost" @click="showRejectModal = false">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-sm btn-danger text-white" @click="confirmReject">
              {{ t('common.confirm_reject') || 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Escalate Modal -->
    <div v-if="showEscalateModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="showEscalateModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold text-warning">
              <i class="bi bi-arrow-up-right-circle me-2"></i>{{ t('supervision.escalate_modal_title') || 'Escalate to Superior Supervisor' }}
            </h5>
            <button type="button" class="btn-close" @click="showEscalateModal = false"></button>
          </div>
          <div class="modal-body p-3">
            <div class="mb-3">
              <label class="tf-label">{{ t('supervision.escalate_to') || 'Escalate To' }} <span class="text-danger">*</span></label>
              <select v-model="escalateToId" class="form-select tf-input">
                <option :value="null">{{ t('supervision.select_superior') || '-- Select Superior in Chain --' }}</option>
                <option v-for="sup in hierarchy.upward_chain" :key="sup.outer_id || sup.id" :value="sup.outer_id || sup.id">
                  {{ sup.full_name || sup.username }} ({{ sup.job_title || 'Manager' }})
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="tf-label">{{ t('supervision.escalation_note') || 'Escalation Note' }}</label>
              <textarea v-model="escalateNote" class="form-control tf-input" rows="2" :placeholder="t('supervision.escalation_note_placeholder') || 'Explain why you are escalating this decision upwards...'"></textarea>
            </div>
          </div>
          <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-tf-ghost" @click="showEscalateModal = false">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-sm btn-warning text-dark" :disabled="!escalateToId" @click="confirmEscalate">
              {{ t('supervision.confirm_escalate') || 'Escalate' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { employeesApi } from '@/api/employees'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { initials, formatDateTime } from '@/utils/formatters'

const EmployeeSelector = defineAsyncComponent(() => import('@/components/EmployeeSelector.vue'))

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const activeTab = ref('hierarchy')
const loading = ref(false)
const actionLoading = ref(null)

const hierarchy = ref({ supervisor: null, subordinates: [], upward_chain: [] })
const allRequests = ref([])

const showNewRequestModal = ref(false)
const submittingReq = ref(false)
const newReq = ref({
  type: 'SUPERVISE',
  target_employee_id: null,
  reason: '',
})

const showRejectModal = ref(false)
const selectedRequest = ref(null)
const rejectReason = ref('')

const showEscalateModal = ref(false)
const escalateToId = ref(null)
const escalateNote = ref('')

const currentEmpId = computed(() => auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id)

const incomingRequests = computed(() => {
  return allRequests.value.filter(r => (r.current_approver === currentEmpId.value || r.current_approver_outer_id === currentEmpId.value) && r.status === 'PENDING')
})

const outgoingRequests = computed(() => {
  return allRequests.value.filter(r => (r.requester === currentEmpId.value || r.requester_outer_id === currentEmpId.value))
})

async function loadData() {
  loading.value = true
  try {
    const [hRes, rRes] = await Promise.all([
      employeesApi.hierarchy().catch(() => ({ data: {} })),
      employeesApi.listSupervisionRequests().catch(() => ({ data: [] })),
    ])
    hierarchy.value = hRes.data || { supervisor: null, subordinates: [], upward_chain: [] }
    const rawRequests = Array.isArray(rRes.data) ? rRes.data : (rRes.data?.results || [])
    allRequests.value = rawRequests
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to load supervision data')
  } finally {
    loading.value = false
  }
}

async function approveRequest(id) {
  actionLoading.value = id
  try {
    await employeesApi.approveSupervisionRequest(id)
    toast.success(t('supervision.approve_success') || 'Supervision request approved and transfer executed!')
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Approval failed')
  } finally {
    actionLoading.value = null
  }
}

function openRejectModal(req) {
  selectedRequest.value = req
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!selectedRequest.value) return
  actionLoading.value = selectedRequest.value.id
  try {
    await employeesApi.rejectSupervisionRequest(selectedRequest.value.id, { reason: rejectReason.value })
    toast.success(t('supervision.reject_success') || 'Request rejected')
    showRejectModal.value = false
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Rejection failed')
  } finally {
    actionLoading.value = null
  }
}

function openEscalateModal(req) {
  selectedRequest.value = req
  escalateToId.value = hierarchy.value.upward_chain?.[0]?.outer_id || hierarchy.value.upward_chain?.[0]?.id || null
  escalateNote.value = ''
  showEscalateModal.value = true
}

async function confirmEscalate() {
  if (!selectedRequest.value || !escalateToId.value) return
  actionLoading.value = selectedRequest.value.id
  try {
    await employeesApi.escalateSupervisionRequest(selectedRequest.value.id, {
      escalate_to_id: escalateToId.value,
      reason: escalateNote.value,
    })
    toast.success(t('supervision.escalate_success') || 'Request escalated to superior supervisor!')
    showEscalateModal.value = false
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Escalation failed')
  } finally {
    actionLoading.value = null
  }
}

async function cancelRequest(id) {
  actionLoading.value = id
  try {
    await employeesApi.cancelSupervisionRequest(id)
    toast.success(t('supervision.cancel_success') || 'Request cancelled')
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to cancel request')
  } finally {
    actionLoading.value = null
  }
}

async function submitNewRequest() {
  submittingReq.value = true
  try {
    let payload = {
      target_employee_id: newReq.value.target_employee_id,
      reason: newReq.value.reason,
    }
    if (newReq.value.type === 'SUPERVISE') {
      payload.requested_supervisor_id = currentEmpId.value
    } else {
      payload.requested_supervisor_id = newReq.value.target_employee_id
      payload.target_employee_id = currentEmpId.value
    }

    await employeesApi.createSupervisionRequest(payload)
    toast.success(t('supervision.request_created_success') || 'Supervision request submitted successfully!')
    showNewRequestModal.value = false
    newReq.value = { type: 'SUPERVISE', target_employee_id: null, reason: '' }
    activeTab.value = 'outgoing'
    loadData()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to submit request')
  } finally {
    submittingReq.value = false
  }
}

onMounted(loadData)
</script>
