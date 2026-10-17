<template>
  <div class="container-fluid p-0" style="max-width: 920px;">
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1 small">
            <li class="breadcrumb-item">
              <RouterLink to="/departments" class="text-decoration-none text-muted">{{ t('assign.breadcrumb_dept') }}</RouterLink>
            </li>
            <li class="breadcrumb-item active text-primary">{{ t('assign.breadcrumb_assign') }}</li>
          </ol>
        </nav>
        <h1 class="page-title mb-1">
          <i class="bi bi-person-gear text-primary me-2"></i>{{ t('assign.page_title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('assign.page_subtitle') }}</p>
      </div>

      <RouterLink to="/departments" class="btn btn-sm btn-tf-ghost">
        <i class="bi bi-arrow-left me-1"></i>{{ t('assign.back_to_units') }}
      </RouterLink>
    </div>

    <!-- Assignment Rules Notice Banner -->
    <div class="alert alert-light border border-secondary-subtle d-flex align-items-center gap-3 p-3 mb-4 rounded-3">
      <i class="bi bi-info-circle-fill text-primary fs-4"></i>
      <div class="small">
        <div class="fw-bold text-dark">{{ t('assign.rule_info_title') }}</div>
        <div class="text-muted">{{ t('assign.rule_info_desc') }}</div>
      </div>
    </div>

    <!-- Assignment Form Card -->
    <div class="tf-card p-4 mb-4">
      <form @submit.prevent="handleAssign">
        <!-- 1. Department/Project Selector -->
        <div class="mb-4">
          <label class="tf-label fw-bold">{{ t('assign.step_1') }} <span class="text-danger">*</span></label>
          <select
            v-model="selectedDeptId"
            class="form-select tf-input"
            @change="onDepartmentChanged"
            required
          >
            <option :value="''" disabled>{{ t('assign.choose_dept') }}</option>
            
            <optgroup v-if="departmentsList.length" :label="t('assign.optgroup_departments')">
              <option
                v-for="dept in departmentsList"
                :key="dept.id"
                :value="dept.id"
              >
                {{ dept.name }} ({{ dept.code }}) - Manager: {{ dept.manager_name || 'None' }}
              </option>
            </optgroup>

            <optgroup v-if="projectsList.length" :label="t('assign.optgroup_projects')">
              <option
                v-for="proj in projectsList"
                :key="proj.id"
                :value="proj.id"
              >
                {{ proj.name }} ({{ proj.code }}) — {{ t('assign.parent_dept') }}: {{ proj.department_name || 'N/A' }} - Manager: {{ proj.manager_name || 'None' }}
              </option>
            </optgroup>
          </select>
        </div>

        <!-- 2. Dynamic Hierarchy Evaluation Banner -->
        <div v-if="evaluatingPermission" class="text-center py-3 mb-4">
          <div class="spinner-border spinner-border-sm text-primary me-2"></div>
          <span class="small text-muted">{{ t('assign.evaluating') }}</span>
        </div>

        <div v-else-if="selectedDeptId && permStatus" class="mb-4">
          <!-- Allowed State -->
          <div
            v-if="permStatus.allowed"
            class="alert alert-success d-flex align-items-start gap-3 p-3 border border-success-subtle mb-0"
          >
            <i class="bi bi-shield-check text-success fs-4 mt-1"></i>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong class="text-success">{{ t('assign.authority_granted') }}</strong>
                <span class="badge bg-success-subtle text-success small">{{ permStatus.case }}</span>
              </div>
              <div class="small mb-1">{{ permStatus.reason }}</div>
              <div v-if="permStatus.details" class="small text-muted">
                Manager: <strong>{{ permStatus.details.manager_name || 'N/A' }}</strong>
                <span v-if="permStatus.details.superior_names && permStatus.details.superior_names.length > 0">
                  &bull; Superior(s): <strong>{{ permStatus.details.superior_names.join(', ') }}</strong>
                </span>
              </div>
            </div>
          </div>

          <!-- Blocked State -->
          <div
            v-else
            class="alert alert-danger d-flex align-items-start gap-3 p-3 border border-danger-subtle mb-0"
          >
            <i class="bi bi-shield-x text-danger fs-4 mt-1"></i>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong class="text-danger">{{ t('assign.action_blocked') }}</strong>
                <span class="badge bg-danger-subtle text-danger small">{{ permStatus.case }}</span>
              </div>
              <div class="small mb-1">{{ permStatus.reason }}</div>
              <div v-if="permStatus.details" class="small text-muted">
                Department Manager: <strong>{{ permStatus.details.manager_name || 'Unassigned' }}</strong>
                <span v-if="permStatus.details.superior_names && permStatus.details.superior_names.length > 0">
                  &bull; Authorized Direct Superior(s): <strong>{{ permStatus.details.superior_names.join(', ') }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Employee Selector -->
        <div class="mb-4">
          <label class="tf-label fw-bold">{{ t('assign.step_2') }} <span class="text-danger">*</span></label>
          <select
            v-model="selectedEmployeeId"
            class="form-select tf-input"
            :disabled="!isAssignmentPermitted || submitting"
            required
          >
            <option :value="''" disabled>{{ t('assign.choose_emp') }}</option>
            <option
              v-for="emp in employees"
              :key="emp.outer_id || emp.id"
              :value="emp.outer_id || emp.id"
            >
              {{ emp.full_name || emp.username }} (@{{ emp.username }}) - {{ formatEmpAssignments(emp) }}
            </option>
          </select>
          <div v-if="!isAssignmentPermitted && selectedDeptId" class="form-text text-danger small">
            <i class="bi bi-lock me-1"></i>{{ t('assign.permission_disabled') }}
          </div>

          <!-- Instant Validation Feedback Box for Selected Employee -->
          <div v-if="selectedEmployeeId && employeeValidation" class="mt-2">
            <div
              v-if="!employeeValidation.valid"
              class="alert alert-danger d-flex align-items-start gap-2 p-2 mb-0 small border border-danger-subtle rounded-3"
            >
              <i class="bi bi-exclamation-triangle-fill text-danger fs-6 mt-0"></i>
              <div>
                <strong>{{ employeeValidation.title || t('assign.action_blocked') }}:</strong>
                {{ employeeValidation.reason }}
              </div>
            </div>
            <div
              v-else-if="employeeValidation.message"
              class="alert alert-success d-flex align-items-start gap-2 p-2 mb-0 small border border-success-subtle rounded-3"
            >
              <i class="bi bi-check-circle-fill text-success fs-6 mt-0"></i>
              <div>{{ employeeValidation.message }}</div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="d-flex justify-content-end gap-2 pt-3 border-top">
          <button
            type="submit"
            class="btn btn-tf-primary px-4"
            :disabled="!isAssignmentPermitted || !selectedEmployeeId || submitting || (employeeValidation && !employeeValidation.valid)"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-person-plus me-1"></i>
            {{ t('assign.confirm_assignment') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Active Unit Assignments Table -->
    <div v-if="selectedDeptId" class="tf-card p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h5 class="fw-bold mb-0">
          <i class="bi bi-people-fill text-primary me-2"></i>{{ t('assign.assigned_members') }}
        </h5>
        <span class="badge bg-secondary-subtle text-secondary small">
          {{ currentAssignments.length }} {{ t('assign.members_count') }}
        </span>
      </div>

      <div v-if="loadingAssignments" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary"></div>
      </div>

      <div v-else-if="currentAssignments.length === 0" class="text-muted text-center py-4 small fst-italic">
        {{ t('assign.no_members') }}
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0" style="font-size:0.85rem;">
          <thead class="text-muted text-uppercase" style="font-size:0.75rem;">
            <tr>
              <th>{{ t('assign.col_employee') }}</th>
              <th>{{ t('assign.col_date') }}</th>
              <th>{{ t('assign.col_status') }}</th>
              <th class="text-end">{{ t('assign.col_action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assign in currentAssignments" :key="assign.id">
              <td>
                <div class="fw-semibold">{{ assign.employee_name }}</div>
              </td>
              <td>{{ formatDate(assign.assigned_at) }}</td>
              <td>
                <span class="badge bg-success-subtle text-success small">
                  {{ assign.is_current ? t('assign.active') : t('assign.past') }}
                </span>
              </td>
              <td class="text-end">
                <button
                  v-if="isAssignmentPermitted"
                  type="button"
                  class="btn btn-xs btn-outline-danger"
                  @click="handleRemoveAssignment(assign.id)"
                  :title="t('assign.remove_member')"
                >
                  <i class="bi bi-trash"></i>
                </button>
                <span v-else class="text-muted small fst-italic">{{ t('assign.locked') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const departments         = ref([])
const employees           = ref([])
const selectedDeptId      = ref('')
const selectedEmployeeId  = ref('')

const permStatus           = ref(null)
const evaluatingPermission = ref(false)
const submitting           = ref(false)

const currentAssignments   = ref([])
const loadingAssignments   = ref(false)

const departmentsList = computed(() => {
  return departments.value.filter(d => d.type === 'DEPARTMENT')
})

const projectsList = computed(() => {
  return departments.value.filter(d => d.type === 'PROJECT')
})

const selectedUnit = computed(() => {
  return departments.value.find(d => d.id === selectedDeptId.value) || null
})

const selectedEmployee = computed(() => {
  return employees.value.find(e => (e.outer_id || e.id) === selectedEmployeeId.value) || null
})

const isAssignmentPermitted = computed(() => {
  return permStatus.value && permStatus.value.allowed === true
})

function formatEmpAssignments(emp) {
  const items = emp.current_projects_departments || []
  if (!items.length) {
    return t('assign.status_no_assignments')
  }
  return items.map(item => {
    const prefix = item.type === 'PROJECT' ? t('assign.status_proj') : t('assign.status_dept')
    return `${prefix}: ${item.name}`
  }).join(' | ')
}

// Client-side rule validation for instantaneous feedback
const employeeValidation = computed(() => {
  if (!selectedUnit.value || !selectedEmployee.value) return null

  const unit = selectedUnit.value
  const emp = selectedEmployee.value
  const assignments = emp.current_projects_departments || []

  // Check duplicate assignment
  if (assignments.some(a => a.id === unit.id)) {
    return {
      valid: false,
      reason: t('assign.already_assigned_here'),
    }
  }

  const activeProjects = assignments.filter(a => a.type === 'PROJECT')
  const activeDepts = assignments.filter(a => a.type === 'DEPARTMENT')

  if (unit.type === 'PROJECT') {
    // Rule 1: Cannot have more than 1 project
    if (activeProjects.length > 0) {
      return {
        valid: false,
        reason: t('assign.cannot_multiple_projects', { project: activeProjects[0].name }),
      }
    }

    // Rule 2: If assigned to a department, project must belong to that same department
    if (activeDepts.length > 0 && unit.department) {
      if (activeDepts[0].id !== unit.department) {
        return {
          valid: false,
          reason: t('assign.mismatch_dept_project', {
            empDept: activeDepts[0].name,
            projectDept: unit.department_name || '',
          }),
        }
      } else {
        return {
          valid: true,
          message: t('assign.valid_match_dept_project', { dept: activeDepts[0].name }),
        }
      }
    }
  } else if (unit.type === 'DEPARTMENT') {
    // Rule 3: Cannot have more than 1 department
    if (activeDepts.length > 0) {
      return {
        valid: false,
        reason: t('assign.cannot_multiple_departments', { dept: activeDepts[0].name }),
      }
    }

    // Rule 4: If has active project, it must belong to this department
    if (activeProjects.length > 0 && activeProjects[0].department_id) {
      if (activeProjects[0].department_id !== unit.id) {
        return {
          valid: false,
          reason: t('assign.mismatch_dept_project_reverse', { project: activeProjects[0].name }),
        }
      } else {
        return {
          valid: true,
          message: t('assign.valid_match_dept_project', { dept: unit.name }),
        }
      }
    }
  }

  return { valid: true }
})

function formatDate(dt) {
  if (!dt) return 'N/A'
  try {
    return new Date(dt).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

async function loadInitialData(isInit = true) {
  try {
    const [deptRes, empRes] = await Promise.all([
      employeesApi.listDepartmentsProjects(),
      employeesApi.list(),
    ])
    departments.value = deptRes.data || []
    employees.value   = empRes.data || []

    if (isInit) {
      const queryDept = route.query.dept
      if (queryDept) {
        const match = departments.value.find(d => d.id === queryDept)
        if (match) {
          selectedDeptId.value = match.id
          await checkPermissionAndAssignments(match.id)
        }
      }
    }
  } catch {
    toast.error('Failed to load initial data')
  }
}

async function onDepartmentChanged() {
  if (!selectedDeptId.value) {
    permStatus.value = null
    currentAssignments.value = []
    return
  }
  await checkPermissionAndAssignments(selectedDeptId.value)
}

async function checkPermissionAndAssignments(deptId) {
  evaluatingPermission.value = true
  permStatus.value           = null

  try {
    const permRes = await employeesApi.checkAssignmentPermission(deptId)
    permStatus.value = permRes.data
  } catch (err) {
    permStatus.value = {
      allowed: false,
      reason: err.response?.data?.message || 'Could not verify hierarchy permissions.',
      case: 'ERROR',
      details: null,
    }
  } finally {
    evaluatingPermission.value = false
  }

  // Load current assignments
  loadAssignments(deptId)
}

async function loadAssignments(deptId) {
  loadingAssignments.value = true
  try {
    const res = await employeesApi.listAssignments({ department_project: deptId })
    currentAssignments.value = res.data || []
  } catch {
    currentAssignments.value = []
  } finally {
    loadingAssignments.value = false
  }
}

async function handleAssign() {
  if (!isAssignmentPermitted.value || !selectedDeptId.value || !selectedEmployeeId.value) return
  if (employeeValidation.value && !employeeValidation.value.valid) {
    toast.error(employeeValidation.value.reason || 'Assignment not allowed.')
    return
  }

  submitting.value = true
  try {
    await employeesApi.createAssignment({
      department_project: selectedDeptId.value,
      employee: selectedEmployeeId.value,
      is_current: true,
    })

    toast.success(t('assign.assign_success'))
    selectedEmployeeId.value = ''
    await Promise.all([
      loadAssignments(selectedDeptId.value),
      loadInitialData(false),
    ])
  } catch (err) {
    const data = err.response?.data
    let msg = ''
    if (typeof data === 'string') {
      msg = data
    } else if (data?.message) {
      msg = data.message
    } else if (data?.error && typeof data.error === 'string') {
      msg = data.error
    } else if (data?.detail) {
      msg = data.detail
    } else if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      if (firstKey && Array.isArray(data[firstKey])) {
        msg = data[firstKey][0]
      } else if (firstKey && typeof data[firstKey] === 'string') {
        msg = data[firstKey]
      }
    }
    toast.error(msg || 'Failed to create assignment.')
  } finally {
    submitting.value = false
  }
}

async function handleRemoveAssignment(id) {
  if (!confirm(t('assign.remove_confirm'))) return
  try {
    await employeesApi.deleteAssignment(id)
    toast.info(t('assign.remove_success'))
    if (selectedDeptId.value) {
      await Promise.all([
        loadAssignments(selectedDeptId.value),
        loadInitialData(false),
      ])
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to remove assignment.')
  }
}

onMounted(() => {
  loadInitialData(true)
})
</script>
