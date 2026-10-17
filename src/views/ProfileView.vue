<template>
  <div class="container-fluid p-0" style="max-width: 900px;">
    <!-- Page Header -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h1 class="page-title mb-1">
          <i class="bi bi-person-badge text-primary me-2"></i>{{ t('profile.title') }}
        </h1>
        <p class="text-muted small mb-0">
          {{ t('profile.subtitle') }}
        </p>
      </div>
      <div class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
        <i class="bi bi-shield-check me-1"></i>{{ t('profile.official_badge') }}
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2rem;height:2rem"></div>
      <div class="text-muted small mt-2">{{ t('profile.loading') }}</div>
    </div>

    <div v-else class="row g-4">
      <!-- Left Column: Edit Form -->
      <div class="col-lg-7">
        <div class="tf-card p-4">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width:56px;height:56px;font-size:1.4rem;">
              {{ initials(profile) }}
            </div>
            <div>
              <h5 class="fw-bold mb-0">{{ profile.full_name || profile.username }}</h5>
              <div class="text-muted small">@{{ profile.username }}</div>
              <span class="badge bg-success-subtle text-success small mt-1">{{ t('profile.active_badge') }}</span>
            </div>
          </div>

          <form @submit.prevent="handleUpdate">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="tf-label">{{ t('profile.first_name') }}</label>
                <input
                  v-model="form.first_name"
                  type="text"
                  class="form-control tf-input"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="tf-label">{{ t('profile.last_name') }}</label>
                <input
                  v-model="form.last_name"
                  type="text"
                  class="form-control tf-input"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="tf-label">{{ t('profile.email') }}</label>
              <input
                v-model="form.email"
                type="email"
                class="form-control tf-input"
                required
              />
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="tf-label">{{ t('profile.job_title') }}</label>
                <input
                  v-model="form.job_title"
                  type="text"
                  class="form-control tf-input"
                />
              </div>
              <div class="col-md-6">
                <label class="tf-label">{{ t('profile.phone') }}</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="form-control tf-input"
                  :placeholder="t('profile.phone_placeholder')"
                />
              </div>
            </div>

            <div v-if="error" class="alert alert-danger py-2 mb-3 small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
            </div>

            <button
              type="submit"
              class="btn btn-tf-primary w-100"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check2-circle me-1"></i>
              {{ t('profile.save_btn') }}
            </button>
          </form>
        </div>
      </div>

      <!-- Right Column: Supervision Hierarchy & Projects -->
      <div class="col-lg-5">
        <!-- Supervision Hierarchy -->
        <div class="tf-card p-3 mb-3">
          <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-diagram-3 text-primary"></i>{{ t('profile.hierarchy_title') }}
          </h6>

          <!-- Direct Supervisors -->
          <div class="mb-3">
            <div class="text-muted small fw-semibold text-uppercase mb-2" style="font-size:0.75rem;">
              {{ t('profile.supervisors') }}
            </div>
            <div v-if="profile.supervisors && profile.supervisors.length > 0" class="d-flex flex-column gap-2">
              <div
                v-for="sup in profile.supervisors"
                :key="sup.outer_id || sup.id"
                class="d-flex align-items-center justify-content-between p-2 rounded bg-surface border"
              >
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-arrow-up-circle text-primary"></i>
                  <span class="fw-semibold small">{{ sup.name }}</span>
                </div>
                <span class="text-muted" style="font-size:0.75rem;">{{ t('profile.since') }} {{ sup.start_date }}</span>
              </div>
            </div>
            <div v-else class="text-muted small fst-italic p-2 rounded bg-surface border">
              {{ t('profile.no_supervisors') }}
            </div>
          </div>

          <!-- Direct Subordinates -->
          <div>
            <div class="text-muted small fw-semibold text-uppercase mb-2" style="font-size:0.75rem;">
              {{ t('profile.subordinates') }}
            </div>
            <div v-if="profile.subordinates && profile.subordinates.length > 0" class="d-flex flex-column gap-2">
              <div
                v-for="sub in profile.subordinates"
                :key="sub.outer_id || sub.id"
                class="d-flex align-items-center justify-content-between p-2 rounded bg-surface border"
              >
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-arrow-down-circle text-success"></i>
                  <span class="fw-semibold small">{{ sub.name }}</span>
                </div>
                <span class="text-muted" style="font-size:0.75rem;">{{ t('profile.since') }} {{ sub.start_date }}</span>
              </div>
            </div>
            <div v-else class="text-muted small fst-italic p-2 rounded bg-surface border">
              {{ t('profile.no_subordinates') }}
            </div>
          </div>
        </div>

        <!-- Current Assignments -->
        <div class="tf-card p-3">
          <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-buildings text-primary"></i>{{ t('profile.assigned_units') }}
          </h6>
          <div v-if="profile.current_projects_departments && profile.current_projects_departments.length > 0" class="d-flex flex-column gap-2">
            <div
              v-for="assign in profile.current_projects_departments"
              :key="assign.outer_id || assign.id"
              class="p-2 rounded bg-surface border d-flex align-items-center justify-content-between"
            >
              <div>
                <span class="fw-semibold small">{{ assign.name }}</span>
                <span class="badge bg-secondary-subtle text-secondary small ms-2">{{ assign.code }}</span>
              </div>
              <span class="badge" :class="assign.type === 'DEPARTMENT' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'">
                {{ assign.type }}
              </span>
            </div>
          </div>
          <div v-else class="text-muted small fst-italic p-2 rounded bg-surface border">
            {{ t('profile.no_units') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { employeesApi } from '@/api/employees'
import { initials } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const toast = useToast()
const auth  = useAuthStore()
const { t } = useI18n()

const profile = ref({})
const form    = ref({
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  phone: '',
})

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

async function fetchProfile() {
  loading.value = true
  try {
    const { data } = await employeesApi.getMe()
    profile.value = data
    form.value = {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      job_title: data.job_title || '',
      phone: data.phone || '',
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load profile')
  } finally {
    loading.value = false
  }
}

async function handleUpdate() {
  saving.value = true
  error.value  = ''

  try {
    const { data } = await employeesApi.updateMe({
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email.trim(),
      job_title: form.value.job_title.trim(),
      phone: form.value.phone.trim(),
    })

    profile.value = data
    if (auth.user) {
      auth.user.full_name = data.full_name
      auth.user.first_name = data.first_name
      auth.user.last_name = data.last_name
      auth.user.email = data.email
    }
    toast.success(t('profile.update_success'))
  } catch (err) {
    const errData = err.response?.data
    if (errData && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0]
      const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]
      error.value = `${firstKey}: ${msg}`
    } else {
      error.value = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || ''
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>
