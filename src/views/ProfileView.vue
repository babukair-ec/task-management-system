<template>
  <div class="container-fluid py-4" style="max-width: 800px;">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <div>
        <h1 class="page-title">
          {{ hasProfile ? t('profile.edit_title') : t('profile.create_title') }}
        </h1>
        <p class="page-subtitle mb-0">
          {{ hasProfile ? t('profile.edit_subtitle') : t('profile.create_subtitle') }}
        </p>
      </div>
      <RouterLink v-if="hasProfile" to="/dashboard" class="btn btn-tf-ghost d-flex align-items-center gap-2">
        <i class="bi bi-speedometer2"></i>
        <span>{{ t('profile.go_dashboard') }}</span>
      </RouterLink>
    </div>

    <!-- Alert Banner when Employee profile is missing -->
    <div
      v-if="!loading && !hasProfile"
      class="alert alert-warning py-3 px-3 d-flex align-items-center gap-3 mb-4 rounded-3 shadow-sm border border-warning-subtle"
    >
      <i class="bi bi-exclamation-triangle-fill fs-3 text-warning flex-shrink-0"></i>
      <div>
        <div class="fw-bold mb-1">{{ t('profile.alert_missing_title') }}</div>
        <div class="small opacity-75">{{ t('profile.alert_missing_desc') }}</div>
      </div>
    </div>

    <!-- Alert Banner when Employee profile is active -->
    <div
      v-else-if="!loading && hasProfile"
      class="alert alert-success py-2 px-3 d-flex align-items-center gap-2 mb-4 rounded-3 shadow-sm border border-success-subtle"
    >
      <i class="bi bi-patch-check-fill text-success fs-5 flex-shrink-0"></i>
      <div class="small fw-semibold">{{ t('profile.alert_active_desc') }}</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-spinner py-5 text-center">
      <div class="spinner-border text-primary mb-2" style="width: 2rem; height: 2rem;"></div>
      <div class="text-muted small">{{ t('common.loading') }}</div>
    </div>

    <!-- Profile Form Card -->
    <div v-else class="tf-card shadow-sm p-4">
      <!-- Profile Header Summary -->
      <div class="d-flex align-items-center gap-3 pb-3 mb-4 border-bottom">
        <div
          class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
          style="width: 56px; height: 56px; background: var(--tf-primary); font-size: 1.25rem;"
        >
          {{ getInitials(form.first_name, form.last_name, form.username) }}
        </div>
        <div>
          <h2 class="h5 mb-1 fw-bold text-truncate" style="max-width: 350px;">
            {{ (form.first_name || form.last_name) ? `${form.first_name} ${form.last_name}`.trim() : form.username }}
          </h2>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style="font-size: 0.75rem;">
              <i class="bi bi-person-badge me-1"></i>{{ form.job_title || 'Team Member' }}
            </span>
            <span v-if="hasProfile" class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style="font-size: 0.75rem;">
              <i class="bi bi-check-circle me-1"></i>{{ t('profile.status_active') }}
            </span>
            <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1" style="font-size: 0.75rem;">
              <i class="bi bi-clock-history me-1"></i>{{ t('profile.status_pending') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Feedback Messages -->
      <div v-if="errorMsg" class="alert alert-danger py-2 mb-3" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-octagon me-1"></i>{{ errorMsg }}
      </div>
      <div v-if="successMsg" class="alert alert-success py-2 mb-3" style="font-size: 0.85rem;">
        <i class="bi bi-check-circle me-1"></i>{{ successMsg }}
      </div>

      <!-- The Form -->
      <form @submit.prevent="handleSubmit">
        <div class="row g-3">
          <!-- First Name -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.first_name') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control tf-input"
              :placeholder="t('auth.first_name_placeholder')"
              required
            />
          </div>

          <!-- Last Name -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.last_name') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control tf-input"
              :placeholder="t('auth.last_name_placeholder')"
              required
            />
          </div>

          <!-- Username (Linked to user-service) -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.username') }}
            </label>
            <input
              :value="form.username"
              type="text"
              class="form-control tf-input bg-body-secondary"
              readonly
              disabled
            />
            <div class="form-text small opacity-75">{{ t('profile.username_immutable') }}</div>
          </div>

          <!-- Email -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.email') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              class="form-control tf-input"
              :placeholder="t('auth.email_placeholder')"
              required
            />
          </div>

          <!-- Job Title -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.job_title') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.job_title"
              type="text"
              class="form-control tf-input"
              :placeholder="t('auth.job_title_placeholder')"
              required
            />
          </div>

          <!-- Phone -->
          <div class="col-12 col-md-6">
            <label class="tf-label mb-1 fw-semibold">
              {{ t('auth.phone') }}
            </label>
            <input
              v-model="form.phone"
              type="text"
              class="form-control tf-input"
              :placeholder="t('auth.phone_placeholder')"
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-4 mt-4 border-top">
          <button
            type="submit"
            class="btn btn-tf-primary px-4 py-2"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else :class="hasProfile ? 'bi bi-check2 me-2' : 'bi bi-person-plus me-2'"></i>
            <span>{{ hasProfile ? t('profile.save_btn') : t('profile.create_btn') }}</span>
          </button>

          <RouterLink
            v-if="hasProfile"
            to="/dashboard"
            class="btn btn-tf-ghost d-flex align-items-center gap-1"
          >
            <span>{{ t('profile.go_dashboard') }}</span>
            <i class="bi bi-arrow-right"></i>
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { useEmployeeSocket } from '@/composables/useEmployeeSocket'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()
const { onEmployeeEvent } = useEmployeeSocket()

const loading = ref(true)
const saving = ref(false)
const hasProfile = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = ref({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  job_title: 'Team Member',
  phone: '',
})

function getInitials(first, last, username) {
  if (first || last) {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
  }
  return (username || '?').slice(0, 2).toUpperCase()
}

async function loadProfile() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const res = await employeesApi.getMe()
    const emp = res.data
    if (emp && (emp.id || emp.outer_id)) {
      hasProfile.value = true
      form.value = {
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        username: emp.username || auth.user?.username || '',
        email: emp.email || '',
        job_title: emp.job_title || 'Team Member',
        phone: emp.phone || '',
      }
      auth.setEmployee(emp)
    } else {
      setupCreationDefaults()
    }
  } catch (err) {
    // 404 or missing profile -> switch to creation form
    setupCreationDefaults()
  } finally {
    loading.value = false
  }
}

function setupCreationDefaults() {
  hasProfile.value = false
  form.value = {
    first_name: auth.user?.first_name || '',
    last_name: auth.user?.last_name || '',
    username: auth.user?.username || '',
    email: auth.user?.email || '',
    job_title: 'Team Member',
    phone: '',
  }
}

async function handleSubmit() {
  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const payload = {
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email.trim(),
      job_title: form.value.job_title.trim() || 'Team Member',
      phone: form.value.phone?.trim() || null,
    }

    if (!hasProfile.value) {
      // Create employee profile
      const res = await employeesApi.createMe(payload)
      const emp = res.data
      hasProfile.value = true
      auth.setEmployee(emp)
      successMsg.value = t('profile.create_success')
      toast.success(t('profile.create_success'))
      // Automatically redirect to dashboard after brief moment
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } else {
      // Update employee profile
      const res = await employeesApi.updateMe(payload)
      const emp = res.data
      auth.setEmployee(emp)
      successMsg.value = t('profile.update_success')
      toast.success(t('profile.update_success'))
    }
  } catch (err) {
    const errData = err.response?.data
    if (errData && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0]
      const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]
      errorMsg.value = `${firstKey}: ${msg}`
    } else {
      errorMsg.value = err.response?.data?.message || err.response?.data?.error || t('profile.save_failed')
    }
    toast.error(errorMsg.value)
  } finally {
    saving.value = false
  }
}

let unsubscribeWs = null

onMounted(() => {
  loadProfile()
  unsubscribeWs = onEmployeeEvent((emp) => {
    if (!emp) return
    const currentUsername = auth.user?.username
    const currentUserOuterId = auth.user?.outer_id || auth.user?.id || auth.user?.user_id

    const matchesUser =
      (currentUsername && emp.username === currentUsername) ||
      (currentUserOuterId && (emp.user_id === currentUserOuterId || emp.outer_id === currentUserOuterId)) ||
      (!hasProfile.value && currentUsername && emp.username === currentUsername)

    if (matchesUser) {
      hasProfile.value = true
      form.value = {
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        username: emp.username || currentUsername || '',
        email: emp.email || '',
        job_title: emp.job_title || 'Team Member',
        phone: emp.phone || '',
      }
      auth.setEmployee(emp)
      successMsg.value = t('profile.alert_active_desc') || 'Employee profile synchronized in real time!'
    }
  })
})

onUnmounted(() => {
  if (unsubscribeWs) unsubscribeWs()
})
</script>
