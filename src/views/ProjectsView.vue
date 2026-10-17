<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1">
          <i class="bi bi-kanban text-info me-2"></i>{{ t('projects.title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('projects.subtitle') }}</p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <RouterLink to="/departments-projects/assign" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-person-check text-primary"></i>
          <span>{{ t('projects.assign_employees') }}</span>
        </RouterLink>
        <RouterLink to="/departments" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-buildings text-primary"></i>
          <span>{{ t('projects.view_departments') }}</span>
        </RouterLink>
        <button
          type="button"
          class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-lg"></i>
          <span>{{ t('projects.add_project') }}</span>
        </button>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <!-- Search Input -->
      <div class="input-group" style="max-width: 320px;">
        <span class="input-group-text bg-surface border-end-0 text-muted">
          <i class="bi bi-search"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control tf-input border-start-0"
          :placeholder="t('projects.search_placeholder')"
        />
      </div>

      <!-- Department Filter Dropdown & Counter -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <div class="d-flex align-items-center gap-2">
          <label class="text-muted small mb-0 fw-semibold text-nowrap">
            <i class="bi bi-funnel text-primary me-1"></i>{{ t('projects.filter_by_dept') }}
          </label>
          <select
            v-model="selectedDepartmentId"
            class="form-select form-select-sm tf-input"
            style="min-width: 220px;"
            @change="updateQueryParam"
          >
            <option value="">{{ t('projects.all_departments') }} ({{ allProjects.length }})</option>
            <option
              v-for="dept in departmentsList"
              :key="dept.id"
              :value="dept.id"
            >
              {{ dept.name }} ({{ dept.code }}) [{{ countByDept(dept.id) }}]
            </option>
          </select>
        </div>

        <button
          v-if="selectedDepartmentId"
          type="button"
          class="btn btn-sm btn-outline-secondary py-1 px-2"
          :title="t('projects.all_departments')"
          @click="clearDepartmentFilter"
        >
          <i class="bi bi-x-circle me-1"></i>{{ t('projects.all_departments') }}
        </button>
      </div>
    </div>

    <!-- Active Department Filter Pill (if selected) -->
    <div v-if="selectedDepartmentObj" class="alert alert-secondary py-2 px-3 mb-4 d-flex align-items-center justify-content-between small">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-building text-primary"></i>
        <span>
          {{ t('projects.parent_department') }}:
          <strong>{{ selectedDepartmentObj.name }}</strong> ({{ selectedDepartmentObj.code }})
        </span>
      </div>
      <button class="btn btn-xs btn-link text-decoration-none p-0 text-muted" @click="clearDepartmentFilter">
        <i class="bi bi-x-lg me-1"></i>{{ t('projects.all_departments') }}
      </button>
    </div>

    <!-- Projects Grid / Cards -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-info" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('projects.loading') }}</div>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="tf-card text-center py-5">
      <i class="bi bi-kanban text-muted" style="font-size: 2.5rem;"></i>
      <h6 class="mt-3 text-muted">{{ t('projects.no_projects') }}</h6>
      <div class="d-flex justify-content-center gap-2 mt-2">
        <button v-if="selectedDepartmentId" class="btn btn-sm btn-tf-ghost" @click="clearDepartmentFilter">
          {{ t('projects.all_departments') }}
        </button>
        <button class="btn btn-sm btn-tf-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg me-1"></i>{{ t('projects.add_project') }}
        </button>
      </div>
    </div>

    <div v-else class="row g-3">
      <div v-for="proj in filteredProjects" :key="proj.id" class="col-12 col-md-6 col-xl-4">
        <div class="tf-card h-100 d-flex flex-column justify-content-between p-3">
          <div>
            <!-- Top Badges -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-1 flex-wrap">
                <span class="badge bg-info-subtle text-info border border-info-subtle">
                  <i class="bi bi-kanban me-1"></i>{{ t('projects.title') }}
                </span>
                <span
                  class="badge bg-primary-subtle text-primary border border-primary-subtle"
                  :title="t('projects.parent_department')"
                >
                  <i class="bi bi-building me-1"></i>{{ getDeptName(proj.department) || t('projects.parent_department') }}
                </span>
              </div>
              <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ proj.code }}</span>
            </div>

            <!-- Title & Description -->
            <h5 class="fw-bold mb-1 text-truncate" :title="proj.name">{{ proj.name }}</h5>
            <p class="text-muted small mb-3" style="min-height: 2.4rem;">
              {{ proj.description || t('task_detail_view.no_description') }}
            </p>

            <!-- Manager Section -->
            <div class="p-2 rounded bg-surface border mb-2">
              <div class="text-muted small" style="font-size:0.75rem;">{{ t('projects.manager') }}:</div>
              <div v-if="proj.manager" class="d-flex align-items-center gap-2 mt-1">
                <i class="bi bi-person-check-fill text-success"></i>
                <span class="fw-semibold small text-truncate">{{ proj.manager_name || 'Assigned' }}</span>
              </div>
              <div v-else class="text-muted small fst-italic mt-1">
                <i class="bi bi-dash-circle me-1"></i>{{ t('projects.unassigned_manager') }}
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-top d-flex align-items-center justify-content-between">
            <RouterLink
              :to="{ path: '/departments-projects/assign', query: { dept: proj.id } }"
              class="btn btn-xs btn-tf-ghost text-primary"
              style="font-size:0.78rem;"
            >
              <i class="bi bi-person-plus me-1"></i>{{ t('projects.assign_team') }}
            </RouterLink>
            <button
              type="button"
              class="btn btn-xs btn-outline-primary px-3 py-1"
              style="font-size:0.78rem;"
              @click="openEditModal(proj)"
            >
              <i class="bi bi-pencil-square me-1"></i>{{ t('projects.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Project Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,0.6);"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold">
              <i :class="isEditMode ? 'bi bi-pencil-square text-warning' : 'bi bi-plus-circle text-primary'" class="me-2"></i>
              {{ isEditMode ? t('projects.modal_edit_title') : t('projects.modal_create_title') }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <form @submit.prevent="saveProject">
            <div class="modal-body p-3">
              <div class="mb-3">
                <label class="tf-label">{{ t('projects.name') }} <span class="text-danger">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('projects.name_placeholder')"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('projects.code') }} <span class="text-danger">*</span></label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control tf-input font-monospace text-uppercase"
                  :placeholder="t('projects.code_placeholder')"
                  required
                />
              </div>

              <!-- Parent Department Selector (Mandatory for Projects) -->
              <div class="mb-3">
                <label class="tf-label">{{ t('projects.parent_department') }} <span class="text-danger">*</span></label>
                <select v-model="form.department" class="form-select tf-input" required>
                  <option :value="null" disabled>{{ t('projects.select_department') }}</option>
                  <option
                    v-for="dept in departmentsList"
                    :key="dept.id"
                    :value="dept.id"
                  >
                    {{ dept.name }} ({{ dept.code }})
                  </option>
                </select>
                <div class="form-text small text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ t('projects.project_dept_rule') }}
                </div>
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('projects.description') }}</label>
                <textarea
                  v-model="form.description"
                  class="form-control tf-input"
                  rows="2"
                  :placeholder="t('projects.description_placeholder')"
                ></textarea>
              </div>

              <!-- Project Manager Selector -->
              <div class="mb-3">
                <label class="tf-label d-flex align-items-center justify-content-between">
                  <span>{{ t('projects.select_manager') }}</span>
                  <span class="text-muted small fw-normal" style="font-size:0.75rem;">{{ t('projects.manager_help_badge') }}</span>
                </label>
                <select v-model="form.manager" class="form-select tf-input">
                  <option :value="null">{{ t('projects.no_manager') }}</option>
                  <option
                    v-for="mgr in eligibleManagers"
                    :key="mgr.id"
                    :value="mgr.id"
                  >
                    {{ mgr.full_name || mgr.username }} ({{ mgr.job_title || 'Team Member' }})
                  </option>
                </select>
                <div class="form-text small text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ t('projects.manager_help') }}
                </div>
              </div>

              <div v-if="modalError" class="alert alert-danger py-2 mb-0 small">
                <i class="bi bi-exclamation-triangle me-1"></i>{{ modalError }}
              </div>
            </div>

            <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-tf-ghost" @click="closeModal">
                {{ t('projects.cancel') }}
              </button>
              <button type="submit" class="btn btn-sm btn-tf-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check2 me-1"></i>
                {{ isEditMode ? t('common.save') : t('projects.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const allUnits             = ref([])
const eligibleManagers     = ref([])
const loading              = ref(true)
const saving               = ref(false)
const searchQuery          = ref('')
const selectedDepartmentId = ref(route.query.dept || '')

const showModal  = ref(false)
const isEditMode = ref(false)
const modalError = ref('')
const editingId  = ref(null)

const form = ref({
  name: '',
  code: '',
  type: 'PROJECT',
  description: '',
  manager: null,
  department: null,
})

const departmentsList = computed(() => {
  return allUnits.value.filter(u => u.type === 'DEPARTMENT')
})

const allProjects = computed(() => {
  return allUnits.value.filter(u => u.type === 'PROJECT')
})

const selectedDepartmentObj = computed(() => {
  if (!selectedDepartmentId.value) return null
  return departmentsList.value.find(d => d.id === selectedDepartmentId.value) || null
})

function getDeptName(deptId) {
  if (!deptId) return ''
  const d = departmentsList.value.find(i => i.id === deptId)
  return d ? d.name : ''
}

function countByDept(deptId) {
  return allProjects.value.filter(p => p.department === deptId).length
}

const filteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const deptId = selectedDepartmentId.value

  return allProjects.value.filter(proj => {
    const matchesDept = !deptId || proj.department === deptId
    const matchesSearch = !q ||
      proj.name.toLowerCase().includes(q) ||
      proj.code.toLowerCase().includes(q) ||
      (proj.manager_name && proj.manager_name.toLowerCase().includes(q)) ||
      (getDeptName(proj.department).toLowerCase().includes(q))
    return matchesDept && matchesSearch
  })
})

function updateQueryParam() {
  if (selectedDepartmentId.value) {
    router.replace({ query: { ...route.query, dept: selectedDepartmentId.value } })
  } else {
    const query = { ...route.query }
    delete query.dept
    router.replace({ query })
  }
}

function clearDepartmentFilter() {
  selectedDepartmentId.value = ''
  updateQueryParam()
}

watch(() => route.query.dept, (newVal) => {
  if (newVal !== undefined && newVal !== selectedDepartmentId.value) {
    selectedDepartmentId.value = newVal || ''
  }
})

async function loadData() {
  loading.value = true
  try {
    const [deptRes, mgrRes] = await Promise.all([
      employeesApi.listDepartmentsProjects(),
      employeesApi.eligibleManagers().catch(() => ({ data: [] })),
    ])
    allUnits.value = deptRes.data || []
    eligibleManagers.value = mgrRes.data || []

    if (route.query.dept) {
      selectedDepartmentId.value = route.query.dept
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load projects')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditMode.value = false
  editingId.value  = null
  modalError.value = ''
  form.value = {
    name: '',
    code: '',
    type: 'PROJECT',
    description: '',
    manager: null,
    department: selectedDepartmentId.value || (departmentsList.value[0]?.id || null),
  }
  showModal.value = true
}

function openEditModal(proj) {
  isEditMode.value = true
  editingId.value  = proj.id
  modalError.value = ''
  form.value = {
    name: proj.name,
    code: proj.code,
    type: 'PROJECT',
    description: proj.description || '',
    manager: proj.manager || null,
    department: proj.department || null,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalError.value = ''
}

async function saveProject() {
  saving.value     = true
  modalError.value = ''

  if (!form.value.department) {
    modalError.value = t('projects.project_must_have_department') || 'Project must belong to a Department.'
    saving.value = false
    return
  }

  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim().toUpperCase(),
    type: 'PROJECT',
    description: form.value.description.trim(),
    manager: form.value.manager || null,
    department: form.value.department,
  }

  try {
    if (isEditMode.value && editingId.value) {
      await employeesApi.updateDepartmentProject(editingId.value, payload)
      toast.success(t('projects.updated_success'))
    } else {
      await employeesApi.createDepartmentProject(payload)
      toast.success(t('projects.created_success'))
    }
    closeModal()
    await loadData()
  } catch (err) {
    const errData = err.response?.data
    if (errData && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0]
      const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]
      modalError.value = `${firstKey}: ${msg}`
    } else {
      modalError.value = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || ''
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
