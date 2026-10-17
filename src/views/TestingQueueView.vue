<template>
  <div>
    <!-- Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <div>
        <h1 class="page-title d-flex align-items-center gap-2">
          <i class="bi bi-patch-check text-info"></i>
          {{ t('testing.queue_title') || 'Testing Queue' }}
        </h1>
        <p class="page-subtitle mb-0">
          {{ t('testing.queue_subtitle') || 'Verify submitted tasks, detect defects, or approve for final closure.' }}
        </p>
      </div>
      <button class="btn btn-sm btn-tf-ghost" @click="loadQueue" :disabled="loading">
        <i class="bi bi-arrow-clockwise me-1" :class="{ 'spin': loading }"></i>
        {{ t('common.refresh') || 'Refresh' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-info" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('common.loading') }}</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="tasks.length === 0" class="tf-card text-center py-5">
      <i class="bi bi-check2-circle text-muted" style="font-size: 3rem;"></i>
      <h5 class="mt-3 text-muted">{{ t('testing.empty_queue_title') || 'No tasks waiting in the Testing Queue' }}</h5>
      <p class="text-muted small">{{ t('testing.empty_queue_desc') || 'All submitted tasks have been tested and verified.' }}</p>
    </div>

    <!-- Queue List -->
    <div v-else class="row g-3">
      <div v-for="task in tasks" :key="task.id" class="col-12 col-md-6 col-xl-4">
        <div class="tf-card h-100 d-flex flex-column justify-content-between p-3 border">
          <div>
            <!-- Top Badges -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge bg-info-subtle text-info border border-info-subtle">
                <i class="bi bi-hourglass-split me-1"></i>{{ t('status.TESTING') || 'TESTING' }}
              </span>
              <span :class="['status-badge', `priority-${task.priority?.toLowerCase()}`]" style="font-size:0.65rem">
                {{ task.priority }}
              </span>
            </div>

            <!-- Title & Project -->
            <h5 class="fw-bold mb-1 text-truncate">
              <RouterLink :to="`/tasks/${task.id}`" class="text-decoration-none text-reset">
                {{ task.title }}
              </RouterLink>
            </h5>
            <div v-if="task.project" class="text-muted small mb-3">
              <i class="bi bi-kanban me-1 text-info"></i>{{ task.project.name || task.project_name }}
            </div>
            <div v-else class="text-muted small mb-3 fst-italic">
              <i class="bi bi-file-earmark me-1"></i>{{ t('tasks.standalone_task') || 'Standalone Task' }}
            </div>

            <!-- Metadata Section -->
            <div class="p-2 rounded bg-surface border mb-3 small" style="font-size:0.78rem">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">{{ t('tasks.original_owner') || 'Original Owner' }}:</span>
                <span class="fw-semibold">{{ task.current_owner_detail?.display_name || task.current_owner_detail?.username || task.current_owner_id }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">{{ t('tasks.creator') }}:</span>
                <span class="fw-semibold">{{ task.creator_detail?.display_name || task.creator_detail?.username || task.creator_id }}</span>
              </div>
              <div v-if="task.review_comment" class="mt-2 pt-2 border-top">
                <span class="text-muted d-block">{{ t('tasks.review_note') || 'Review Note' }}:</span>
                <span class="fst-italic text-secondary">"{{ task.review_comment }}"</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-3 border-top d-flex align-items-center justify-content-between gap-2">
            <RouterLink :to="`/tasks/${task.id}`" class="btn btn-xs btn-tf-ghost">
              <i class="bi bi-eye me-1"></i>{{ t('common.view') || 'View' }}
            </RouterLink>

            <div class="d-flex align-items-center gap-1" v-if="isTester">
              <button class="btn btn-xs btn-outline-info" @click="startTest(task.id)">
                <i class="bi bi-play-circle me-1"></i>{{ t('testing.start') || 'Start' }}
              </button>
              <button class="btn btn-xs btn-success text-white" @click="openResultModal(task, 'PASSED')">
                <i class="bi bi-check-lg me-1"></i>{{ t('testing.pass') || 'Pass' }}
              </button>
              <button class="btn btn-xs btn-danger text-white" @click="openResultModal(task, 'FAILED')">
                <i class="bi bi-x-lg me-1"></i>{{ t('testing.fail') || 'Fail' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Modal -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="showModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold">
              <i :class="selectedResult === 'PASSED' ? 'bi bi-check-circle text-success' : 'bi bi-exclamation-octagon text-danger'" class="me-2"></i>
              {{ selectedResult === 'PASSED' ? (t('testing.modal_pass_title') || 'Pass & Close Task') : (t('testing.modal_fail_title') || 'Fail & Return to Owner') }}
            </h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body p-3">
            <p class="small text-muted mb-2">
              <strong>{{ t('tasks.task_title') }}:</strong> {{ selectedTask?.title }}
            </p>
            <div class="mb-3">
              <label class="tf-label">{{ t('testing.notes_label') || 'Testing Findings & Notes' }}</label>
              <textarea v-model="notes" class="form-control tf-input" rows="3" :placeholder="t('testing.notes_placeholder') || 'Enter test details, reproduction steps if failed, or verification logs...'"></textarea>
            </div>
          </div>
          <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-tf-ghost" @click="showModal = false">{{ t('common.cancel') }}</button>
            <button type="button" :class="['btn btn-sm', selectedResult === 'PASSED' ? 'btn-success text-white' : 'btn-danger text-white']" :disabled="submitting" @click="submitTestResult">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ selectedResult === 'PASSED' ? (t('testing.confirm_pass') || 'Confirm Pass (Close)') : (t('testing.confirm_fail') || 'Confirm Failure') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const tasks = ref([])
const loading = ref(false)
const submitting = ref(false)

const showModal = ref(false)
const selectedTask = ref(null)
const selectedResult = ref('PASSED')
const notes = ref('')

const isTester = computed(() => {
  return auth.employee?.employee_type === 'TESTER' || auth.user?.employee_type === 'TESTER'
})

async function loadQueue() {
  loading.value = true
  try {
    const { data } = await tasksApi.testingQueue()
    tasks.value = data || []
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to load testing queue')
  } finally {
    loading.value = false
  }
}

async function startTest(taskId) {
  try {
    await tasksApi.startTest(taskId)
    toast.success(t('testing.start_success') || 'Test registered as started')
    loadQueue()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to start test')
  }
}

function openResultModal(task, result) {
  selectedTask.value = task
  selectedResult.value = result
  notes.value = ''
  showModal.value = true
}

async function submitTestResult() {
  if (!selectedTask.value) return
  submitting.value = true
  try {
    await tasksApi.completeTest(selectedTask.value.id, {
      result: selectedResult.value,
      notes: notes.value,
    })
    toast.success(selectedResult.value === 'PASSED'
      ? (t('testing.pass_success') || 'Task passed and closed!')
      : (t('testing.fail_success') || 'Task failed and returned to original owner!'))
    showModal.value = false
    loadQueue()
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to complete test')
  } finally {
    submitting.value = false
  }
}

onMounted(loadQueue)
</script>
