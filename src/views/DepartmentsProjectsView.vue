<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1">
          <i class="bi bi-buildings text-primary me-2"></i>{{ t('departments_projects.title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('departments_projects.subtitle') }}</p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <RouterLink to="/departments-projects/assign" class="btn btn-sm btn-tf-ghost d-flex align-items-center gap-1">
          <i class="bi bi-person-check text-primary"></i>
          <span>{{ t('departments_projects.assign_employees') }}</span>
        </RouterLink>
        <button
          type="button"
          class="btn btn-sm btn-tf-primary d-flex align-items-center gap-1"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-lg"></i>
          <span>{{ t('departments_projects.add_unit') }}</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div class="input-group" style="max-width: 320px;">
        <span class="input-group-text bg-surface border-end-0 text-muted">
          <i class="bi bi-search"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control tf-input border-start-0"
          :placeholder="t('departments_projects.search_placeholder')"
        />
      </div>

      <div class="btn-group btn-group-sm">
        <button
          type="button"
          class="btn"
          :class="typeFilter === 'ALL' ? 'btn-primary' : 'btn-tf-ghost'"
          @click="typeFilter = 'ALL'"
        >
          {{ t('departments_projects.filter_all') }} ({{ items.length }})
        </button>
        <button
          type="button"
          class="btn"
          :class="typeFilter === 'DEPARTMENT' ? 'btn-primary' : 'btn-tf-ghost'"
          @click="typeFilter = 'DEPARTMENT'"
        >
          {{ t('departments_projects.filter_departments') }}
        </button>
        <button
          type="button"
          class="btn"
          :class="typeFilter === 'PROJECT' ? 'btn-primary' : 'btn-tf-ghost'"
          @click="typeFilter = 'PROJECT'"
        >
          {{ t('departments_projects.filter_projects') }}
        </button>
      </div>
    </div>

    <!-- Items Grid / Cards -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('departments_projects.loading') }}</div>
    </div>

    <div v-else-if="filteredItems.length === 0" class="tf-card text-center py-5">
      <i class="bi bi-folder2-open text-muted" style="font-size: 2.5rem;"></i>
      <h6 class="mt-3 text-muted">{{ t('departments_projects.no_units') }}</h6>
      <button class="btn btn-sm btn-tf-primary mt-2" @click="openCreateModal">
        <i class="bi bi-plus-lg me-1"></i>{{ t('departments_projects.add_unit') }}
      </button>
    </div>

    <div v-else class="row g-3">
      <div v-for="item in filteredItems" :key="item.id" class="col-12 col-md-6 col-xl-4">
        <div class="tf-card h-100 d-flex flex-column justify-content-between p-3">
          <div>
            <!-- Top Badges -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-1">
                <span
                  class="badge"
                  :class="item.type === 'DEPARTMENT' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-info-subtle text-info border border-info-subtle'"
                >
                  <i :class="item.type === 'DEPARTMENT' ? 'bi bi-building' : 'bi bi-kanban'" class="me-1"></i>
                  {{ item.type === 'DEPARTMENT' ? t('departments_projects.type_department') : t('departments_projects.type_project') }}
                </span>
                <span v-if="item.type === 'PROJECT' && (item.department || item.department_name)" class="badge bg-light text-dark border" :title="t('departments_projects.parent_department')">
                  <i class="bi bi-building me-1"></i>{{ item.department_name || getDeptName(item.department) }}
                </span>
              </div>
              <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ item.code }}</span>
            </div>

            <!-- Title & Description -->
            <h5 class="fw-bold mb-1 text-truncate" :title="item.name">{{ item.name }}</h5>
            <p class="text-muted small mb-3" style="min-height: 2.4rem;">
              {{ item.description || t('task_detail_view.no_description') }}
            </p>

            <!-- Manager Section -->
            <div class="p-2 rounded bg-surface border mb-2">
              <div class="text-muted small" style="font-size:0.75rem;">{{ t('departments_projects.manager') }}:</div>
              <div v-if="item.manager" class="d-flex align-items-center gap-2 mt-1">
                <i class="bi bi-person-check-fill text-success"></i>
                <span class="fw-semibold small text-truncate">{{ item.manager_name || 'Assigned' }}</span>
              </div>
              <div v-else class="text-muted small fst-italic mt-1">
                <i class="bi bi-dash-circle me-1"></i>{{ t('departments_projects.unassigned_manager') }}
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-top d-flex align-items-center justify-content-between">
            <RouterLink
              :to="{ path: '/departments-projects/assign', query: { dept: item.id } }"
              class="btn btn-xs btn-tf-ghost text-primary"
              style="font-size:0.78rem;"
            >
              <i class="bi bi-person-plus me-1"></i>{{ t('departments_projects.assign_team') }}
            </RouterLink>
            <button
              type="button"
              class="btn btn-xs btn-outline-primary px-3 py-1"
              style="font-size:0.78rem;"
              @click="openEditModal(item)"
            >
              <i class="bi bi-pencil-square me-1"></i>{{ t('departments_projects.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,0.6);"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 540px;">
        <div class="modal-content tf-card p-0 border">
          <div class="modal-header border-bottom p-3">
            <h5 class="modal-title fw-bold">
              <i :class="isEditMode ? 'bi bi-pencil-square text-warning' : 'bi bi-plus-circle text-primary'" class="me-2"></i>
              {{ isEditMode ? t('departments_projects.modal_edit_title') : t('departments_projects.modal_create_title') }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <form @submit.prevent="saveItem">
            <div class="modal-body p-3">
              <div class="mb-3">
                <label class="tf-label">{{ t('departments_projects.name') }} <span class="text-danger">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('departments_projects.name_placeholder')"
                  required
                />
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="tf-label">{{ t('departments_projects.code') }} <span class="text-danger">*</span></label>
                  <input
                    v-model="form.code"
                    type="text"
                    class="form-control tf-input font-monospace text-uppercase"
                    :placeholder="t('departments_projects.code_placeholder')"
                    required
                  />
                </div>
                <div class="col-6">
                  <label class="tf-label">{{ t('departments_projects.unit_type') }} <span class="text-danger">*</span></label>
                  <select v-model="form.type" class="form-select tf-input" required>
                    <option value="DEPARTMENT">{{ t('departments_projects.type_department') }}</option>
                    <option value="PROJECT">{{ t('departments_projects.type_project') }}</option>
                  </select>
                </div>
              </div>

              <!-- Parent Department for Projects -->
              <div v-if="form.type === 'PROJECT'" class="mb-3">
                <label class="tf-label">{{ t('departments_projects.parent_department') || 'Parent Department' }} <span class="text-danger">*</span></label>
                <select v-model="form.department" class="form-select tf-input" required>
                  <option :value="null">{{ t('departments_projects.select_department') || '-- Select Department --' }}</option>
                  <option v-for="dept in departmentsList" :key="dept.id" :value="dept.id">
                    {{ dept.name }} ({{ dept.code }})
                  </option>
                </select>
                <div class="form-text small text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ t('departments_projects.project_dept_rule') || 'Every project must belong to exactly one department.' }}
                </div>
              </div>

              <div class="mb-3">
                <label class="tf-label">{{ t('departments_projects.description') }}</label>
                <textarea
                  v-model="form.description"
                  class="form-control tf-input"
                  rows="2"
                  :placeholder="t('departments_projects.description_placeholder')"
                ></textarea>
              </div>

              <!-- Manager Selector (Eligible Managers Only) -->
              <div class="mb-3">
                <label class="tf-label d-flex align-items-center justify-content-between">
                  <span>{{ t('departments_projects.select_manager') }}</span>
                  <span class="text-muted small fw-normal" style="font-size:0.75rem;">{{ t('departments_projects.manager_help_badge') }}</span>
                </label>
                <select v-model="form.manager" class="form-select tf-input">
                  <option :value="null">{{ t('departments_projects.no_manager') }}</option>
                  <option
                    v-for="mgr in eligibleManagers"
                    :key="mgr.outer_id || mgr.id"
                    :value="mgr.outer_id || mgr.id"
                  >
                    {{ mgr.full_name || mgr.username }} ({{ mgr.job_title || 'Team Member' }})
                  </option>
                </select>
                <div class="form-text small text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ t('departments_projects.manager_help') }}
                </div>
              </div>

              <div v-if="modalError" class="alert alert-danger py-2 mb-0 small">
                <i class="bi bi-exclamation-triangle me-1"></i>{{ modalError }}
              </div>
            </div>

            <div class="modal-footer border-top p-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-tf-ghost" @click="closeModal">
                {{ t('departments_projects.cancel') }}
              </button>
              <button type="submit" class="btn btn-sm btn-tf-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check2 me-1"></i>
                {{ isEditMode ? t('common.save') : t('departments_projects.save') }}
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

const items            = ref([])
const eligibleManagers = ref([])
const loading          = ref(true)
const saving           = ref(false)
const searchQuery      = ref('')
const typeFilter       = ref('ALL')

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

const departmentsList = computed(() => items.value.filter(i => i.type === 'DEPARTMENT'))

function getDeptName(deptId) {
  if (!deptId) return ''
  const d = items.value.find(i => i.id === deptId)
  return d ? d.name : ''
}

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesType = typeFilter.value === 'ALL' || item.type === typeFilter.value
    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })
})

async function loadData() {
  loading.value = true
  try {
    const [deptRes, mgrRes] = await Promise.all([
      employeesApi.listDepartmentsProjects(),
      employeesApi.eligibleManagers().catch(() => ({ data: [] })),
    ])
    items.value = deptRes.data || []
    eligibleManagers.value = mgrRes.data || []
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load departments and projects')
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

function openEditModal(item) {
  isEditMode.value = true
  editingId.value  = item.id
  modalError.value = ''
  form.value = {
    name: item.name,
    code: item.code,
    type: item.type,
    description: item.description || '',
    manager: item.manager || null,
    department: item.department || null,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalError.value = ''
}

async function saveItem() {
  saving.value     = true
  modalError.value = ''

  if (form.value.type === 'PROJECT' && !form.value.department) {
    modalError.value = t('departments_projects.project_must_have_department') || 'Project must belong to a Department.'
    saving.value = false
    return
  }

  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim().toUpperCase(),
    type: form.value.type,
    description: form.value.description.trim(),
    manager: form.value.manager || null,
    department: form.value.type === 'PROJECT' ? form.value.department : null,
  }

  try {
    if (isEditMode.value && editingId.value) {
      await employeesApi.updateDepartmentProject(editingId.value, payload)
      toast.success(t('departments_projects.updated_success'))
    } else {
      await employeesApi.createDepartmentProject(payload)
      toast.success(t('departments_projects.created_success'))
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
