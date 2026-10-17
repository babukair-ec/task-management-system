<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1">
          <i class="bi bi-buildings text-primary me-2"></i>{{ t('departments.title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('departments.subtitle') }}</p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <RouterLink to="/departments-projects/assign" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-person-check text-primary"></i>
          <span>{{ t('departments.assign_employees') }}</span>
        </RouterLink>
        <RouterLink to="/projects" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-kanban text-info"></i>
          <span>{{ t('departments.view_projects') }}</span>
        </RouterLink>
        <button
          type="button"
          class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-lg"></i>
          <span>{{ t('departments.add_department') }}</span>
        </button>
      </div>
    </div>

    <!-- Search Controls -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div class="input-group" style="max-width: 360px;">
        <span class="input-group-text bg-surface border-end-0 text-muted">
          <i class="bi bi-search"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control tf-input border-start-0"
          :placeholder="t('departments.search_placeholder')"
        />
      </div>

      <div class="text-muted small">
        <span class="badge bg-secondary-subtle text-secondary font-monospace fs-6">
          {{ filteredDepartments.length }}
        </span>
        <span class="ms-1">{{ t('nav.departments') }}</span>
      </div>
    </div>

    <!-- Departments Grid / Cards -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('departments.loading') }}</div>
    </div>

    <div v-else-if="filteredDepartments.length === 0" class="tf-card text-center py-5">
      <i class="bi bi-building text-muted" style="font-size: 2.5rem;"></i>
      <h6 class="mt-3 text-muted">{{ t('departments.no_departments') }}</h6>
      <button class="btn btn-sm btn-tf-primary mt-2" @click="openCreateModal">
        <i class="bi bi-plus-lg me-1"></i>{{ t('departments.add_department') }}
      </button>
    </div>

    <div v-else class="row g-3">
      <div v-for="dept in filteredDepartments" :key="dept.id" class="col-12 col-md-6 col-xl-4">
        <div class="tf-card h-100 d-flex flex-column justify-content-between p-3">
          <div>
            <!-- Top Badges -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                <i class="bi bi-building me-1"></i>{{ t('departments.title') }}
              </span>
              <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ dept.code }}</span>
            </div>

            <!-- Title & Description -->
            <h5 class="fw-bold mb-1 text-truncate" :title="dept.name">{{ dept.name }}</h5>
            <p class="text-muted small mb-3" style="min-height: 2.4rem;">
              {{ dept.description || t('task_detail_view.no_description') }}
            </p>

            <!-- Linked Projects Counter -->
            <div class="mb-2">
              <RouterLink
                :to="{ path: '/projects', query: { dept: dept.id } }"
                class="badge bg-info-subtle text-info text-decoration-none border border-info-subtle py-1 px-2"
                :title="t('departments.view_dept_projects')"
              >
                <i class="bi bi-kanban me-1"></i>
                {{ getProjectsCount(dept.id) }} {{ t('departments.projects_count') }}
                <i class="bi bi-arrow-right ms-1"></i>
              </RouterLink>
            </div>

            <!-- Manager Section -->
            <div class="p-2 rounded bg-surface border mb-2">
              <div class="text-muted small" style="font-size:0.75rem;">{{ t('departments.manager') }}:</div>
              <div v-if="dept.manager" class="d-flex align-items-center gap-2 mt-1">
                <i class="bi bi-person-check-fill text-success"></i>
                <span class="fw-semibold small text-truncate">{{ dept.manager_name || 'Assigned' }}</span>
              </div>
              <div v-else class="text-muted small fst-italic mt-1">
                <i class="bi bi-dash-circle me-1"></i>{{ t('departments.unassigned_manager') }}
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-top d-flex align-items-center justify-content-between">
            <RouterLink
              :to="{ path: '/departments-projects/assign', query: { dept: dept.id } }"
              class="btn btn-xs btn-tf-ghost text-primary"
              style="font-size:0.78rem;"
            >
              <i class="bi bi-person-plus me-1"></i>{{ t('departments.assign_team') }}
            </RouterLink>
            <button
              type="button"
              class="btn btn-xs btn-outline-primary px-3 py-1"
              style="font-size:0.78rem;"
              @click="openEditModal(dept)"
            >
              <i class="bi bi-pencil-square me-1"></i>{{ t('departments.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Department Modal -->
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
              {{ isEditMode ? t('departments.modal_edit_title') : t('departments.modal_create_title') }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <form @submit.prevent="saveDepartment">
            <div class="modal-body p-3">
              <div class="mb-3">
                <label class="tf-label">{{ t('departments.name') }} <span class="text-danger">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('departments.name_placeholder')"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('departments.code') }} <span class="text-danger">*</span></label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control tf-input font-monospace text-uppercase"
                  :placeholder="t('departments.code_placeholder')"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('departments.description') }}</label>
                <textarea
                  v-model="form.description"
                  class="form-control tf-input"
                  rows="2"
                  :placeholder="t('departments.description_placeholder')"
                ></textarea>
              </div>

              <!-- Department Manager Selector -->
              <div class="mb-3">
                <label class="tf-label d-flex align-items-center justify-content-between">
                  <span>{{ t('departments.select_manager') }}</span>
                  <span class="text-muted small fw-normal" style="font-size:0.75rem;">{{ t('departments.manager_help_badge') }}</span>
                </label>
                <select v-model="form.manager" class="form-select tf-input">
                  <option :value="null">{{ t('departments.no_manager') }}</option>
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
                  {{ t('departments.manager_help') }}
                </div>
              </div>

              <div v-if="modalError" class="alert alert-danger py-2 mb-0 small">
                <i class="bi bi-exclamation-triangle me-1"></i>{{ modalError }}
              </div>
            </div>

            <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-tf-ghost" @click="closeModal">
                {{ t('departments.cancel') }}
              </button>
              <button type="submit" class="btn btn-sm btn-tf-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check2 me-1"></i>
                {{ isEditMode ? t('common.save') : t('departments.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const toast = useToast()
const { t } = useI18n()

const allUnits         = ref([])
const eligibleManagers = ref([])
const loading          = ref(true)
const saving           = ref(false)
const searchQuery      = ref('')

const showModal  = ref(false)
const isEditMode = ref(false)
const modalError = ref('')
const editingId  = ref(null)

const form = ref({
  name: '',
  code: '',
  type: 'DEPARTMENT',
  description: '',
  manager: null,
  department: null,
})

const departmentsList = computed(() => {
  return allUnits.value.filter(u => u.type === 'DEPARTMENT')
})

const projectsList = computed(() => {
  return allUnits.value.filter(u => u.type === 'PROJECT')
})

function getProjectsCount(deptId) {
  if (!deptId) return 0
  return projectsList.value.filter(p => p.department === deptId).length
}

const filteredDepartments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return departmentsList.value.filter(dept => {
    return !q ||
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      (dept.manager_name && dept.manager_name.toLowerCase().includes(q))
  })
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
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load departments')
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
    type: 'DEPARTMENT',
    description: '',
    manager: null,
    department: null,
  }
  showModal.value = true
}

function openEditModal(dept) {
  isEditMode.value = true
  editingId.value  = dept.id
  modalError.value = ''
  form.value = {
    name: dept.name,
    code: dept.code,
    type: 'DEPARTMENT',
    description: dept.description || '',
    manager: dept.manager || null,
    department: null,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalError.value = ''
}

async function saveDepartment() {
  saving.value     = true
  modalError.value = ''

  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim().toUpperCase(),
    type: 'DEPARTMENT',
    description: form.value.description.trim(),
    manager: form.value.manager || null,
    department: null,
  }

  try {
    if (isEditMode.value && editingId.value) {
      await employeesApi.updateDepartmentProject(editingId.value, payload)
      toast.success(t('departments.updated_success'))
    } else {
      await employeesApi.createDepartmentProject(payload)
      toast.success(t('departments.created_success'))
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
