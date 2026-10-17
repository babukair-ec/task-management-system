<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1">
          <i class="bi bi-people text-primary me-2"></i>{{ t('employee_directory.title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('employee_directory.subtitle') }}</p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <RouterLink to="/profile" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-person-badge text-primary"></i>
          <span>{{ t('employee_directory.my_profile') }}</span>
        </RouterLink>
        <RouterLink to="/employees/create" class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1">
          <i class="bi bi-person-plus"></i>
          <span>{{ t('employee_directory.add_employee') }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="mb-4">
      <div class="input-group" style="max-width: 380px;">
        <span class="input-group-text bg-surface border-end-0 text-muted">
          <i class="bi bi-search"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control tf-input border-start-0"
          :placeholder="t('employee_directory.search_placeholder')"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('employee_directory.loading') }}</div>
    </div>

    <div v-else-if="filteredEmployees.length === 0" class="tf-card text-center py-5">
      <i class="bi bi-people text-muted" style="font-size: 2.5rem;"></i>
      <h6 class="mt-3 text-muted">{{ t('employee_directory.no_results') }}</h6>
    </div>

    <div v-else class="row g-3">
      <div v-for="emp in filteredEmployees" :key="emp.outer_id || emp.id" class="col-12 col-md-6 col-xl-4">
        <div class="tf-card h-100 d-flex flex-column justify-content-between p-3">
          <div>
            <!-- Top Avatar & Name -->
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style="width:48px;height:48px;font-size:1.1rem">
                {{ initials(emp) }}
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-items-center justify-content-between gap-1">
                  <span class="fw-bold text-truncate" :title="emp.full_name || emp.username">
                    {{ emp.full_name || emp.username }}
                  </span>
                  <span v-if="isMe(emp)" class="badge bg-primary-subtle text-primary small">{{ t('employee_directory.you') }}</span>
                </div>
                <div class="text-muted small">@{{ emp.username }}</div>
                <div class="text-primary small fw-semibold mt-1">
                  {{ emp.job_title || 'Team Member' }}
                </div>
              </div>
            </div>

            <!-- Details: Contact & Roles -->
            <div class="small text-muted mb-3 d-flex flex-column gap-1">
              <div v-if="emp.email" class="d-flex align-items-center gap-2 text-truncate" :title="emp.email">
                <i class="bi bi-envelope text-secondary"></i>
                <span class="text-truncate">{{ emp.email }}</span>
              </div>
              <div v-if="emp.phone" class="d-flex align-items-center gap-2">
                <i class="bi bi-telephone text-secondary"></i>
                <span>{{ emp.phone }}</span>
              </div>
            </div>

            <!-- Hierarchy Pill Badges -->
            <div class="pt-2 border-top mb-2">
              <div class="d-flex flex-wrap gap-2 small">
                <!-- Supervisors -->
                <span
                  class="badge bg-secondary-subtle text-secondary"
                  :title="emp.supervisors && emp.supervisors.length ? 'Supervised by: ' + emp.supervisors.map(s => s.name).join(', ') : 'No direct supervisors'"
                >
                  <i class="bi bi-arrow-up-circle me-1"></i>
                  {{ emp.supervisors && emp.supervisors.length ? `${emp.supervisors.length} ${t('employee_directory.supervisors_count')}` : t('employee_directory.top_authority') }}
                </span>

                <!-- Subordinates -->
                <span
                  v-if="emp.subordinates && emp.subordinates.length"
                  class="badge bg-info-subtle text-info"
                  :title="'Supervises: ' + emp.subordinates.map(s => s.name).join(', ')"
                >
                  <i class="bi bi-arrow-down-circle me-1"></i>
                  {{ `${emp.subordinates.length} ${t('employee_directory.subordinates_count')}` }}
                </span>
              </div>
            </div>

            <!-- Department/Project Assignments -->
            <div v-if="emp.current_projects_departments && emp.current_projects_departments.length" class="d-flex flex-wrap gap-1 mt-1">
              <span
                v-for="dept in emp.current_projects_departments"
                :key="dept.id"
                class="badge bg-light text-dark border small"
                :title="dept.name"
              >
                {{ dept.name }}
              </span>
            </div>
          </div>

          <!-- Bottom Action: Strictly Profile Link for Self, No Administrative Edits -->
          <div class="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
            <span class="text-muted" style="font-size:0.75rem;">
              {{ t('employee_directory.joined') }} {{ formatDate(emp.created_at) }}
            </span>
            <RouterLink v-if="isMe(emp)" to="/profile" class="btn btn-xs btn-outline-primary py-1 px-2" style="font-size:0.75rem;">
              <i class="bi bi-pencil me-1"></i>{{ t('employee_directory.edit_in_profile') }}
            </RouterLink>
            <span v-else class="text-muted small fst-italic" style="font-size:0.75rem;">
              {{ t('employee_directory.readonly') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { initials } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const toast = useToast()
const auth  = useAuthStore()
const { t } = useI18n()

const employees   = ref([])
const loading     = ref(true)
const searchQuery = ref('')

function isMe(emp) {
  const myOuterId = auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id
  const myUsername = auth.user?.username
  return (emp.outer_id && emp.outer_id === myOuterId) ||
         (emp.id && emp.id === myOuterId) ||
         (emp.user_id && emp.user_id === myOuterId) ||
         (emp.username === myUsername)
}

function formatDate(dt) {
  if (!dt) return 'N/A'
  try {
    return new Date(dt).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

const filteredEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return employees.value
  return employees.value.filter(e => {
    const fullName = (e.full_name || '').toLowerCase()
    const username = (e.username || '').toLowerCase()
    const title = (e.job_title || '').toLowerCase()
    const depts = (e.current_projects_departments || []).map(d => d.name.toLowerCase()).join(' ')
    return fullName.includes(q) || username.includes(q) || title.includes(q) || depts.includes(q)
  })
})

onMounted(async () => {
  try {
    const { data } = await employeesApi.list()
    employees.value = data
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load employees')
  } finally {
    loading.value = false
  }
})
</script>
