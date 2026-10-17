<template>
  <div class="container-fluid p-0" style="max-width: 780px;">
    <!-- Page Header -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1 small">
            <li class="breadcrumb-item">
              <RouterLink to="/employees" class="text-decoration-none text-muted">{{ t('employee_create.breadcrumb_employees') }}</RouterLink>
            </li>
            <li class="breadcrumb-item active text-primary">{{ t('employee_create.title') }}</li>
          </ol>
        </nav>
        <h1 class="page-title mb-1">
          <i class="bi bi-person-plus text-primary me-2"></i>{{ t('employee_create.title') }}
        </h1>
        <p class="text-muted small mb-0">{{ t('employee_create.subtitle') }}</p>
      </div>
      <RouterLink to="/employees" class="btn btn-sm btn-tf-ghost">
        <i class="bi bi-arrow-left me-1"></i>{{ t('employee_create.back_to_directory') }}
      </RouterLink>
    </div>

    <!-- Creation Card -->
    <div class="tf-card p-4">
      <form @submit.prevent="handleSubmit">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="tf-label">{{ t('employee_create.first_name') }} <span class="text-danger">*</span></label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control tf-input"
              :placeholder="t('employee_create.first_name_placeholder')"
              required
            />
          </div>
          <div class="col-md-6">
            <label class="tf-label">{{ t('employee_create.last_name') }} <span class="text-danger">*</span></label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control tf-input"
              :placeholder="t('employee_create.last_name_placeholder')"
              required
            />
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="tf-label">{{ t('employee_create.username') }} <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-transparent text-muted border-end-0">@</span>
              <input
                v-model="form.username"
                type="text"
                class="form-control tf-input border-start-0"
                :placeholder="t('employee_create.username_placeholder')"
                required
              />
            </div>
          </div>
          <div class="col-md-6">
            <label class="tf-label">{{ t('employee_create.email') }} <span class="text-danger">*</span></label>
            <input
              v-model="form.email"
              type="email"
              class="form-control tf-input"
              :placeholder="t('employee_create.email_placeholder')"
              required
            />
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <label class="tf-label">{{ t('employee_create.job_title') }} <span class="text-danger">*</span></label>
            <input
              v-model="form.job_title"
              type="text"
              class="form-control tf-input"
              :placeholder="t('employee_create.job_title_placeholder')"
              required
            />
          </div>
          <div class="col-md-4">
            <label class="tf-label">{{ t('employee_create.phone') }}</label>
            <input
              v-model="form.phone"
              type="text"
              class="form-control tf-input"
              :placeholder="t('employee_create.phone_placeholder')"
            />
          </div>
          <div class="col-md-4">
            <label class="tf-label">{{ t('employee_create.password') }} <span class="text-danger">*</span></label>
            <div class="password-input-wrap">
              <input
                v-model="form.password"
                id="employee-password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control tf-input"
                :placeholder="t('employee_create.password_placeholder')"
                required
                minlength="4"
              />
              <button
                type="button"
                class="password-toggle-btn"
                :title="showPassword ? t('auth.hide_password') : t('auth.show_password')"
                :aria-label="showPassword ? t('auth.hide_password') : t('auth.show_password')"
                @click="showPassword = !showPassword"
              >
                <i :class="['bi', showPassword ? 'bi-eye-slash' : 'bi-eye', 'fs-6']"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger py-2 mb-3" style="font-size: 0.85rem;">
          <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
        </div>

        <div class="d-flex justify-content-end gap-2 pt-2 border-top">
          <RouterLink to="/employees" class="btn btn-tf-ghost">
            {{ t('employee_create.cancel') }}
          </RouterLink>
          <button
            type="submit"
            class="btn btn-tf-primary px-4"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-person-plus me-1"></i>
            {{ t('employee_create.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { authApi } from '@/api/auth'
import { employeesApi } from '@/api/employees'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const toast  = useToast()
const { t }  = useI18n()

const form = ref({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  job_title: 'Team Member',
  phone: '',
})

const showPassword = ref(false)
const submitting   = ref(false)
const error        = ref('')

async function handleSubmit() {
  submitting.value = true
  error.value      = ''

  try {
    const username = form.value.username.trim()
    const password = form.value.password
    const firstName = form.value.first_name.trim()
    const lastName = form.value.last_name.trim()
    const email = form.value.email.trim()
    const jobTitle = form.value.job_title.trim() || 'Team Member'
    const phone = form.value.phone?.trim() || null

    // 1. Create the user record in user-service first
    const regRes = await authApi.register({
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      email: email,
      job_title: jobTitle,
      phone: phone,
    })

    const createdUser = regRes.data?.user
    const userOuterId = createdUser?.outer_id || createdUser?.id

    toast.success(t('employee_create.create_success'))
    router.push('/employees')
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
    submitting.value = false
  }
}
</script>
