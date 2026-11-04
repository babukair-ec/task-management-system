<template>
  <div class="employees-page">
    <!-- Header with Search & Actions -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div>
        <h1 class="page-title d-flex align-items-center gap-2 mb-0">
          <i class="bi bi-people-fill text-primary"></i>
          <span>{{ t('employees.title') }}</span>
        </h1>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Live Search -->
        <div class="position-relative" style="min-width: 220px;">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small" :class="{ 'start-auto end-0 me-3': isRTL }"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm tf-input ps-5"
            :class="{ 'pe-5 ps-3': isRTL }"
            :placeholder="t('employees.search_placeholder')"
          />
        </div>

        <!-- Refresh Button -->
        <button
          class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1"
          :disabled="loading || refreshing"
          @click="loadData(true)"
          :title="t('employees.refresh')"
        >
          <i :class="['bi bi-arrow-clockwise', { 'spin-animation': refreshing }]"></i>
          <span class="d-none d-sm-inline">{{ t('employees.refresh') }}</span>
        </button>

        <!-- Add Employee Button -->
        <button
          class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1"
          @click="showAddModal = true"
        >
          <i class="bi bi-person-plus-fill"></i>
          <span class="d-none d-sm-inline">{{ t('employees.add_employee') }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-spinner py-5 text-center">
      <div class="spinner-border text-primary mb-2" style="width: 2.2rem; height: 2.2rem;"></div>
      <div class="text-muted small">{{ t('common.loading') }}</div>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMsg" class="alert alert-danger py-3 px-4 rounded-3 shadow-sm mb-4 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-octagon-fill fs-5"></i>
        <span>{{ errorMsg }}</span>
      </div>
      <button class="btn btn-sm btn-outline-danger" @click="loadData(false)">
        {{ t('employees.refresh') }}
      </button>
    </div>

    <!-- Unified Square Cards Grid (No Split Sections) -->
    <div v-else>
      <div v-if="filteredCards.length > 0" class="row g-3 g-md-4">
        <div
          v-for="emp in filteredCards"
          :key="emp.outer_id || emp.id || emp.email"
          class="col-12 col-sm-6 col-md-4 col-xl-3"
        >
          <!-- Square Card -->
          <div
            class="tf-card square-card h-100 p-3 shadow-sm d-flex flex-column align-items-center text-center justify-content-between position-relative"
            :class="{ 'my-card-highlight': emp.is_me }"
          >
            <!-- Card Top: Badges -->
            <div class="w-100 d-flex align-items-center justify-content-between gap-1 mb-2">
              <span
                v-if="emp.is_me"
                class="badge bg-primary text-white px-2 py-1 shadow-sm"
                style="font-size: 0.72rem;"
              >
                <i class="bi bi-person-check-fill me-1"></i>{{ t('employees.you') }}
              </span>
              <span
                v-else-if="emp.is_direct"
                class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0"
                style="font-size: 0.68rem;"
              >
                <i class="bi bi-star-fill me-1"></i>{{ t('employees.badge_direct') }}
              </span>
              <span v-else></span>

              <span
                v-if="emp.employee_type === 'TESTER'"
                class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0"
                style="font-size: 0.68rem;"
              >
                {{ t('employees.type_tester') }}
              </span>
            </div>

            <!-- Card Center: Avatar & Info -->
            <div class="d-flex flex-column align-items-center my-auto w-100 px-2">
              <!-- Avatar -->
              <div
                class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm mb-2 flex-shrink-0"
                :style="emp.is_me
                  ? 'width: 58px; height: 58px; font-size: 1.3rem; background: linear-gradient(135deg, var(--tf-primary), var(--tf-secondary)); border: 2px solid var(--tf-primary);'
                  : 'width: 54px; height: 54px; font-size: 1.15rem; background: linear-gradient(135deg, var(--tf-primary), var(--tf-accent));'"
              >
                {{ getInitials(emp.first_name, emp.last_name, emp.full_name) }}
              </div>

              <!-- Full Name -->
              <h2 class="h6 fw-bold mb-1 text-truncate w-100" :title="emp.full_name">
                {{ emp.full_name }}
              </h2>

              <!-- Job Title -->
              <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-0 text-truncate max-w-100 mb-2" style="font-size: 0.72rem;">
                <i class="bi bi-briefcase me-1"></i>{{ emp.job_title || 'Team Member' }}
              </span>

              <!-- Supervisor Line (shown only if employee has a supervisor) -->
              <div
                v-if="emp.supervisor_name"
                class="supervisor-box small rounded-2 px-2 py-1 w-100 mt-1 d-flex align-items-center justify-content-center gap-1 text-truncate"
                style="background: var(--tf-surface-3); font-size: 0.75rem;"
                :title="emp.supervisor_name"
              >
                <i class="bi bi-person-up text-primary"></i>
                <span class="text-muted">{{ t('employees.supervisor') }}:</span>
                <strong class="text-primary text-truncate">{{ emp.supervisor_name }}</strong>
              </div>
            </div>

            <!-- Card Bottom: Profile Link or Email -->
            <div class="w-100 pt-3 mt-2 border-top" style="border-color: var(--tf-border) !important;">
              <!-- If it's My Card: Link to Profile Button -->
              <RouterLink
                v-if="emp.is_me"
                to="/profile"
                class="btn btn-sm btn-tf-primary w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                <i class="bi bi-person-gear"></i>
                <span>{{ t('employees.link_to_profile') }}</span>
              </RouterLink>

              <!-- For Supervised Employees: Email and Copy -->
              <div
                v-else
                class="d-flex align-items-center justify-content-between small text-muted w-100"
              >
                <div class="text-truncate me-1 text-start" :class="{ 'text-end': isRTL }" :title="emp.email || t('employees.not_provided')">
                  <i class="bi bi-envelope me-1"></i>
                  <span class="text-truncate">{{ emp.email || t('employees.not_provided') }}</span>
                </div>
                <button
                  v-if="emp.email"
                  class="btn btn-link p-0 text-muted hover-primary flex-shrink-0"
                  @click="copyToClipboard(emp.email, emp.outer_id || emp.email)"
                  :title="t('employees.copy_email')"
                >
                  <i :class="copiedId === (emp.outer_id || emp.email) ? 'bi bi-check-lg text-success' : 'bi bi-clipboard'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State if search matches nothing -->
      <div v-else class="tf-card text-center py-5">
        <i class="bi bi-search fs-2 text-muted opacity-50 mb-2 d-block"></i>
        <h4 class="h6 fw-bold mb-1">{{ t('employees.no_search_results') }}</h4>
        <p class="text-muted small mb-3">"{{ searchQuery }}"</p>
        <button class="btn btn-sm btn-tf-ghost" @click="searchQuery = ''">
          <i class="bi bi-x-circle me-1"></i> Clear search
        </button>
      </div>
    </div>

    <!-- Add Employee Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-backdrop fade show" @click="closeAddModal"></div>
      <div v-if="showAddModal" class="modal fade show d-block" tabindex="-1" @click.self="closeAddModal">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content tf-card border-0 shadow">
            <div class="modal-header border-bottom" style="border-color: var(--tf-border) !important;">
              <h5 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                <i class="bi bi-person-plus-fill text-primary"></i>
                {{ t('employees.add_employee') }}
              </h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div>
            <form @submit.prevent="submitAddEmployee">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Username -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_username') }} *</label>
                    <input v-model="addForm.username" type="text" class="form-control tf-input" required />
                  </div>
                  <!-- Password -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_password') }} *</label>
                    <input v-model="addForm.password" type="password" class="form-control tf-input" required minlength="4" />
                  </div>
                  <!-- First Name -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_first_name') }} *</label>
                    <input v-model="addForm.first_name" type="text" class="form-control tf-input" required />
                  </div>
                  <!-- Last Name -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_last_name') }} *</label>
                    <input v-model="addForm.last_name" type="text" class="form-control tf-input" required />
                  </div>
                  <!-- Email -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_email') }} *</label>
                    <input v-model="addForm.email" type="email" class="form-control tf-input" required />
                  </div>
                  <!-- Job Title -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_job_title') }} *</label>
                    <input v-model="addForm.job_title" type="text" class="form-control tf-input" required />
                  </div>
                  <!-- Department -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_department') }}</label>
                    <input v-model="addForm.department" type="text" class="form-control tf-input" />
                  </div>
                  <!-- Phone -->
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">{{ t('employees.add_form_phone') }}</label>
                    <input v-model="addForm.phone" type="text" class="form-control tf-input" />
                  </div>
                </div>

                <!-- Error message -->
                <div v-if="addError" class="alert alert-danger mt-3 py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <span>{{ addError }}</span>
                </div>
              </div>
              <div class="modal-footer border-top" style="border-color: var(--tf-border) !important;">
                <button type="button" class="btn btn-sm btn-tf-ghost" @click="closeAddModal" :disabled="addSubmitting">
                  {{ t('employees.add_form_cancel') }}
                </button>
                <button type="submit" class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1" :disabled="addSubmitting">
                  <span v-if="addSubmitting" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-person-plus"></i>
                  {{ addSubmitting ? t('employees.add_form_submitting') : t('employees.add_form_submit') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const auth = useAuthStore()
const toast = useToast()
const { t, isRTL } = useI18n()

const loading = ref(true)
const refreshing = ref(false)
const errorMsg = ref('')

const currentEmp = ref(null)
const hierarchyData = ref(null)
const supervisedList = ref([])

const searchQuery = ref('')
const copiedId = ref('')

// Add Employee Modal state
const showAddModal = ref(false)
const addSubmitting = ref(false)
const addError = ref('')
const addFormDefaults = () => ({
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  department: 'General',
  phone: '',
})
const addForm = ref(addFormDefaults())

function closeAddModal() {
  if (addSubmitting.value) return
  showAddModal.value = false
  addError.value = ''
  addForm.value = addFormDefaults()
}

async function submitAddEmployee() {
  addSubmitting.value = true
  addError.value = ''
  try {
    const supervisorOuterId = currentEmp.value?.outer_id || auth.employee?.outer_id || null
    const payload = {
      ...addForm.value,
      phone: addForm.value.phone || null,
    }
    if (supervisorOuterId) {
      payload.supervisor_outer_id = String(supervisorOuterId)
    }
    await authApi.register(payload)
    toast.success(t('employees.add_success'))
    closeAddModal()
    // Refresh data after a short delay to allow event processing
    setTimeout(() => loadData(true), 1500)
  } catch (err) {
    const data = err?.response?.data
    if (data && typeof data === 'object') {
      const messages = Object.entries(data)
        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
        .join(' | ')
      addError.value = messages || t('employees.add_error')
    } else {
      addError.value = err?.message || t('employees.add_error')
    }
  } finally {
    addSubmitting.value = false
  }
}

function getInitials(first, last, full) {
  if (first || last) {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
  }
  if (full) {
    const parts = full.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return full.slice(0, 2).toUpperCase()
  }
  return '?'
}

async function copyToClipboard(text, id) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    toast.success(t('employees.email_copied'))
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = ''
    }, 2500)
  } catch {
    toast.info(text)
  }
}

const directSupervisorName = computed(() => {
  if (currentEmp.value?.supervisors?.length) {
    const sup = currentEmp.value.supervisors[0]
    return sup.name || sup.full_name || null
  }
  if (hierarchyData.value?.supervisors?.length) {
    const sup = hierarchyData.value.supervisors[0]
    return sup.full_name || null
  }
  if (hierarchyData.value?.current_employee?.supervisor_name) {
    return hierarchyData.value.current_employee.supervisor_name
  }
  return null
})

// Unified list of all cards: My card first, followed by supervised employees
const allEmployeeCards = computed(() => {
  const cards = []

  // 1. My Card
  if (currentEmp.value) {
    cards.push({
      outer_id: currentEmp.value.outer_id || 'me',
      full_name: currentEmp.value.full_name || auth.user?.full_name || auth.user?.username,
      first_name: currentEmp.value.first_name,
      last_name: currentEmp.value.last_name,
      job_title: currentEmp.value.job_title || 'Team Member',
      employee_type: currentEmp.value.employee_type || 'EMPLOYEE',
      email: currentEmp.value.email || auth.user?.email || null,
      phone: currentEmp.value.phone || null,
      supervisor_name: directSupervisorName.value,
      is_me: true,
      is_direct: false,
    })
  }

  // 2. Supervised Employees Cards
  for (const sub of supervisedList.value) {
    cards.push({
      ...sub,
      is_me: false,
    })
  }

  return cards
})

const filteredCards = computed(() => {
  let list = allEmployeeCards.value
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(s => {
      const name = (s.full_name || '').toLowerCase()
      const job = (s.job_title || '').toLowerCase()
      const sup = (s.supervisor_name || '').toLowerCase()
      const email = (s.email || '').toLowerCase()
      return name.includes(q) || job.includes(q) || sup.includes(q) || email.includes(q)
    })
  }
  return list
})

async function loadData(isRefresh = false) {
  if (isRefresh) {
    refreshing.value = true
  } else {
    loading.value = true
  }
  errorMsg.value = ''

  try {
    const [meRes, hierRes] = await Promise.allSettled([
      employeesApi.getMe(),
      employeesApi.getHierarchy(),
    ])

    if (meRes.status === 'fulfilled' && meRes.value?.data) {
      currentEmp.value = meRes.value.data
      auth.setEmployee(meRes.value.data)
    } else if (auth.employee) {
      currentEmp.value = auth.employee
    }

    if (hierRes.status === 'fulfilled' && hierRes.value?.data) {
      hierarchyData.value = hierRes.value.data
      if (!currentEmp.value && hierRes.value.data.current_employee) {
        currentEmp.value = hierRes.value.data.current_employee
      }
    }

    // Direct reports map
    const directSubsMap = new Map()
    if (currentEmp.value?.subordinates?.length) {
      for (const d of currentEmp.value.subordinates) {
        directSubsMap.set(String(d.outer_id), d)
      }
    }

    const unifiedList = []
    const seenIds = new Set()
    const myName = currentEmp.value?.full_name || auth.user?.full_name || auth.user?.username

    // 1. From hierarchy
    if (hierarchyData.value?.subordinates?.length) {
      for (const sub of hierarchyData.value.subordinates) {
        const idStr = String(sub.outer_id)
        seenIds.add(idStr)
        const directMatch = directSubsMap.get(idStr)
        const isDirect = sub.is_direct ?? !!directMatch
        unifiedList.push({
          outer_id: idStr,
          full_name: sub.full_name,
          job_title: sub.job_title,
          employee_type: sub.employee_type || 'EMPLOYEE',
          email: sub.email || directMatch?.email || null,
          phone: sub.phone || directMatch?.phone || null,
          is_direct: isDirect,
          supervisor_name: sub.supervisor_name || (isDirect ? myName : null),
        })
      }
    }

    // 2. Direct subordinates from getMe (if hierarchy didn't return them)
    if (currentEmp.value?.subordinates?.length) {
      for (const d of currentEmp.value.subordinates) {
        const idStr = String(d.outer_id)
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr)
          unifiedList.push({
            outer_id: idStr,
            full_name: d.name || d.full_name,
            job_title: d.job_title || 'Team Member',
            employee_type: d.employee_type || 'EMPLOYEE',
            email: d.email || null,
            phone: d.phone || null,
            is_direct: true,
            supervisor_name: myName,
          })
        }
      }
    }

    supervisedList.value = unifiedList

    if (isRefresh) {
      toast.info(t('employees.refresh'))
    }
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Failed to load employee data'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => {
  loadData(false)
})
</script>

<style scoped>
.spin-animation {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.hover-primary:hover {
  color: var(--tf-primary) !important;
}

.square-card {
  aspect-ratio: 1 / 1;
  min-height: 250px;
  border-radius: var(--tf-radius);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.square-card:hover {
  transform: translateY(-3px);
  border-color: var(--tf-primary) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.my-card-highlight {
  border: 1.5px solid var(--tf-primary) !important;
  box-shadow: 0 0 12px var(--tf-primary-glow);
}
</style>
