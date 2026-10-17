<template>
  <div>
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="page-title">{{ t('tasks.my_tasks_title') }}</h1>
        <p class="page-subtitle">{{ t('tasks.my_tasks_subtitle') }}</p>
      </div>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary">
        <i class="bi bi-plus-lg me-2"></i>{{ t('tasks.create_btn') }}
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
      <div class="d-flex gap-2 flex-wrap">
        <button
          v-for="f in filterList"
          :key="f.value"
          :class="['btn btn-sm', activeFilter === f.value ? 'btn-tf-primary' : 'btn-tf-ghost']"
          @click="setFilter(f.value)"
        >{{ f.label }}</button>
      </div>

      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0"><i class="bi bi-kanban me-1"></i>{{ t('tasks.project') || 'Project' }}:</label>
        <select v-model="selectedProject" class="form-select form-select-sm tf-input" style="max-width: 220px">
          <option value="">{{ t('tasks.all_projects') || 'All Projects' }}</option>
          <option v-for="proj in projects" :key="proj.id" :value="proj.id">
            {{ proj.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <div v-else-if="tasks.length">
      <TaskCard v-for="t in tasks" :key="t.id" :task="t" class="mb-2" />
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>{{ t('tasks.no_tasks') }}</p>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary btn-sm">{{ t('tasks.create_btn') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { employeesApi } from '@/api/employees'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const TaskCard = defineAsyncComponent(() => import('@/components/TaskCard.vue'))

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const tasks  = ref([])
const projects = ref([])
const selectedProject = ref('')
const loading = ref(false)
const activeFilter = ref('all')

const filterList = computed(() => [
  { value: 'all',            label: t('tasks.filter_all') },
  { value: 'ASSIGNED',       label: t('tasks.filter_assigned') },
  { value: 'IN_PROGRESS',    label: t('tasks.filter_in_progress') },
  { value: 'PENDING_REVIEW', label: t('status.PENDING_REVIEW') || 'In Review' },
  { value: 'TESTING',        label: t('status.TESTING') || 'Testing' },
  { value: 'BLOCKED',        label: t('tasks.filter_blocked') },
  { value: 'CLOSED',         label: t('status.CLOSED') || 'Closed' },
  { value: 'COMPLETED',      label: t('tasks.filter_completed') },
  { value: 'DRAFT',          label: t('status.DRAFT') },
])

async function load() {
  loading.value = true
  try {
    const employeeId = auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id
    const params = { owner_id: employeeId,creator_id: employeeId}
    if (activeFilter.value !== 'all') {
      params.status = activeFilter.value
    }
    if (selectedProject.value) {
      params.project_id = selectedProject.value
    }
    const { data } = await tasksApi.list(params)
    tasks.value = data || []
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load tasks')
  } finally {
    loading.value = false
  }
}

function setFilter(v) {
  activeFilter.value = v
}

watch([activeFilter, selectedProject], load)

onMounted(async () => {
  try {
    const res = await employeesApi.listDepartmentsProjects()
    const all = Array.isArray(res.data) ? res.data : (res.data?.results || [])
    projects.value = all.filter(item => item.type === 'PROJECT')
  } catch (e) {
    console.error('Failed to load projects filter', e)
  }
  load()
})
</script>
