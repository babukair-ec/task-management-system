<template>
  <div class="d-flex flex-column justify-content-between position-relative" style="min-height:100vh; background: var(--tf-bg)">
    <!-- Top Bar with Language & Theme Toggle -->
    <div class="d-flex justify-content-end align-items-center p-3 gap-2">
      <!-- Language -->
      <div class="dropdown">
        <button class="btn btn-sm btn-tf-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-translate text-primary me-1"></i>
          {{ locale === 'ar' ? 'العربية' : 'English' }}
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow">
          <li><button class="dropdown-item" :class="{ active: locale === 'en' }" @click="setLocale('en')">🇺🇸 English</button></li>
          <li><button class="dropdown-item" :class="{ active: locale === 'ar' }" @click="setLocale('ar')">🇸🇦 العربية</button></li>
        </ul>
      </div>

      <!-- Theme -->
      <div class="dropdown">
        <button class="btn btn-sm btn-tf-ghost dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
          <i :class="['bi', currentThemeObj?.icon, 'text-warning']"></i>
          <span>{{ t(`themes.${theme}`) }}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow">
          <li v-for="th in themes" :key="th.id">
            <button
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              :class="{ active: theme === th.id }"
              @click="setTheme(th.id)"
            >
              <div class="d-flex align-items-center gap-2">
                <i :class="['bi', th.icon]"></i>
                <span>{{ t(`themes.${th.id}`) }}</span>
              </div>
              <span
                v-for="(col, idx) in th.colors"
                :key="idx"
                class="theme-preview-dot"
                :style="{ backgroundColor: col }"
              ></span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Center Card -->
    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-3">
      <div style="width:100%; max-width:420px">
        <!-- Brand -->
        <div class="text-center mb-4">
          <h1 class="navbar-brand-text" style="font-size:2rem; color:var(--tf-primary)">
            {{ t('nav.brand') }}
          </h1>
        </div>

        <!-- Card -->
        <div class="tf-card" style="padding:2rem">
          <!-- Card Header (Only when registering) -->
          <div v-if="isRegister" class="mb-4">
            <h2 class="mb-1" style="font-size:1.15rem; font-weight:700">
              {{ t('auth.create_account') }}
            </h2>
            <p class="text-muted mb-0" style="font-size:0.82rem">
              {{ t('auth.register_subtitle') }}
            </p>
          </div>

          <!-- Sign In Form -->
          <form v-if="!isRegister" @submit.prevent="handleLogin">
            <div class="mb-3">
              <label class="tf-label">{{ t('auth.username') }}</label>
              <input
                v-model="form.username"
                id="username"
                type="text"
                class="form-control tf-input"
                :placeholder="t('auth.username_placeholder')"
                autocomplete="username"
                required
              />
            </div>
            <div class="mb-4">
              <label class="tf-label">{{ t('auth.password') }}</label>
              <div class="password-input-wrap">
                <input
                  v-model="form.password"
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control tf-input"
                  :placeholder="t('auth.password_placeholder')"
                  autocomplete="current-password"
                  required
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

            <!-- Session Expired Warning Banner -->
            <div v-if="isSessionExpired" class="alert alert-warning py-2 mb-3 d-flex align-items-center gap-2" style="font-size:0.82rem">
              <i class="bi bi-clock-history text-warning fs-6"></i>
              <span>{{ t('errors.ERR_TOKEN_EXPIRED') }}</span>
            </div>

            <div v-if="error" class="alert alert-danger py-2 mb-3" style="font-size:0.82rem">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
            </div>
            <div v-if="successMsg" class="alert alert-success py-2 mb-3" style="font-size:0.82rem">
              <i class="bi bi-check-circle me-1"></i>{{ successMsg }}
            </div>

            <button
              type="submit"
              class="btn btn-tf-primary w-100"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-box-arrow-in-right me-2"></i>
              {{ t('auth.sign_in') }}
            </button>

            <!-- Visible Create Account Callout Link -->
            <div class="text-center mt-3">
              <span class="text-muted small">{{ t('auth.no_account') }} </span>
              <a href="#" class="small text-primary fw-semibold text-decoration-none" @click.prevent="showRegister">
                {{ t('auth.sign_up') }}
              </a>
            </div>
          </form>

          <!-- Sign Up / Registration Form -->
          <form v-else @submit.prevent="handleRegister">
            <div class="row g-2 mb-2">
              <div class="col-6">
                <label class="tf-label">{{ t('auth.first_name') }} <span class="text-danger">*</span></label>
                <input
                  v-model="regForm.first_name"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('auth.first_name_placeholder')"
                  required
                />
              </div>
              <div class="col-6">
                <label class="tf-label">{{ t('auth.last_name') }} <span class="text-danger">*</span></label>
                <input
                  v-model="regForm.last_name"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('auth.last_name_placeholder')"
                  required
                />
              </div>
            </div>

            <div class="mb-2">
              <label class="tf-label">{{ t('auth.username') }} <span class="text-danger">*</span></label>
              <input
                v-model="regForm.username"
                id="reg-username"
                type="text"
                class="form-control tf-input"
                :placeholder="t('auth.username_placeholder')"
                autocomplete="username"
                required
              />
            </div>

            <div class="mb-2">
              <label class="tf-label">{{ t('auth.email') }} <span class="text-danger">*</span></label>
              <input
                v-model="regForm.email"
                id="reg-email"
                type="email"
                class="form-control tf-input"
                :placeholder="t('auth.email_placeholder')"
                autocomplete="email"
                required
              />
            </div>

            <div class="row g-2 mb-2">
              <div class="col-7">
                <label class="tf-label">{{ t('auth.job_title') }} <span class="text-danger">*</span></label>
                <input
                  v-model="regForm.job_title"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('auth.job_title_placeholder')"
                  required
                />
              </div>
              <div class="col-5">
                <label class="tf-label">{{ t('auth.phone') }}</label>
                <input
                  v-model="regForm.phone"
                  type="text"
                  class="form-control tf-input"
                  :placeholder="t('auth.phone_placeholder')"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="tf-label">{{ t('auth.password') }} <span class="text-danger">*</span></label>
              <div class="password-input-wrap">
                <input
                  v-model="regForm.password"
                  id="reg-password"
                  :type="showRegPassword ? 'text' : 'password'"
                  class="form-control tf-input"
                  :placeholder="t('auth.password_min')"
                  autocomplete="new-password"
                  required
                  minlength="4"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  :title="showRegPassword ? t('auth.hide_password') : t('auth.show_password')"
                  :aria-label="showRegPassword ? t('auth.hide_password') : t('auth.show_password')"
                  @click="showRegPassword = !showRegPassword"
                >
                  <i :class="['bi', showRegPassword ? 'bi-eye-slash' : 'bi-eye', 'fs-6']"></i>
                </button>
              </div>
            </div>

            <div v-if="error" class="alert alert-danger py-2 mb-3" style="font-size:0.82rem">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
            </div>
            <div v-if="successMsg" class="alert alert-success py-2 mb-3" style="font-size:0.82rem">
              <i class="bi bi-check-circle me-1"></i>{{ successMsg }}
            </div>

            <button
              type="submit"
              class="btn btn-tf-primary w-100"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-person-plus me-2"></i>
              {{ t('auth.create_account') }}
            </button>

            <div class="text-center mt-3">
              <span class="text-muted small">{{ t('auth.have_account') }} </span>
              <a href="#" class="small text-primary fw-semibold text-decoration-none" @click.prevent="showLogin">
                {{ t('auth.sign_in') }}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api/auth'

import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()
const { t, locale, setLocale } = useI18n()
const { theme, themes, setTheme } = useTheme()

const currentThemeObj = computed(() => themes.find(th => th.id === theme.value) || themes[0])

const isRegister = ref(false)
const showPassword = ref(false)
const showRegPassword = ref(false)
const form       = ref({ username: '', password: '' })
const regForm    = ref({
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  job_title: 'Team Member',
  department: 'Engineering',
  phone: '',
})
const loading    = ref(false)
const error      = ref('')
const successMsg = ref('')

const isSessionExpired = computed(() => route.query.expired === 'true' || auth.sessionExpired)

onMounted(() => {
  if (route.query.mode === 'register' || route.path === '/register') {
    isRegister.value = true
  }
})

function showRegister() {
  isRegister.value = true
  showPassword.value = false
  showRegPassword.value = false
  error.value = ''
  successMsg.value = ''
}

function showLogin() {
  isRegister.value = false
  showPassword.value = false
  showRegPassword.value = false
  error.value = ''
  successMsg.value = ''
}

async function handleLogin() {
  loading.value = true
  error.value   = ''
  try {
    // Request 1: Authenticate with User Service to get JWT token and user info
    const tokenRes = await authApi.getTokenAndUser(form.value.username, form.value.password)
    const tokenData = tokenRes.data
    const token = tokenData.token || tokenData.access
    const user = tokenData.user || { username: form.value.username }
    const expiresIn = tokenData.expires_in || 28800

    // Request 2: Fetch employee profile with Bearer token from Employee Service
    let employee = null
    try {
      const empRes = await authApi.getEmployeeProfile(token)
      employee = empRes.data
    } catch (empErr) {
      console.warn('[handleLogin] Employee profile request failed, falling back to user data:', empErr)
      employee = user
    }

    // Store auth credentials and employee profile
    auth.setAuth(token, user, employee, expiresIn)
    toast.success(t('auth.sign_in_success'))
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || e.response?.data?.non_field_errors?.[0] || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  loading.value = true
  error.value   = ''
  successMsg.value = ''

  try {
    const username = regForm.value.username.trim()
    const password = regForm.value.password
    const firstName = regForm.value.first_name.trim()
    const lastName = regForm.value.last_name.trim()
    const email = regForm.value.email.trim()
    const jobTitle = regForm.value.job_title?.trim() || 'Team Member'
    const phone = regForm.value.phone?.trim() || null

    // 1. Create the user record in User Service
    const regRes = await authApi.register({
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      email,
      job_title: jobTitle,
      phone,
    })

    const createdUser = regRes.data?.user
    const userOuterId = createdUser?.outer_id || createdUser?.id

    toast.success(t('auth.register_success'))
    successMsg.value = t('auth.register_redirect')

    // 3. Automatically log the user in using two-request workflow
    try {
      // Request 1: Get token and user data
      const tokenRes = await authApi.getTokenAndUser(regForm.value.username, regForm.value.password)
      const tokenData = tokenRes.data
      const token = tokenData.token || tokenData.access
      const user = tokenData.user || { username: regForm.value.username }
      const expiresIn = tokenData.expires_in || 28800

      // Request 2: Get employee profile
      let employee = null
      try {
        const empRes = await authApi.getEmployeeProfile(token)
        employee = empRes.data
      } catch (empErr) {
        console.warn('[handleRegister] Employee profile request fallback:', empErr)
        employee = user
      }

      auth.setAuth(token, user, employee, expiresIn)
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    } catch {
      // If auto-login fails, redirect user to sign in tab
      isRegister.value = false
      form.value.username = regForm.value.username
      form.value.password = ''
      successMsg.value = t('auth.register_done_signin')
    }
  } catch (e) {
    const errData = e.response?.data
    if (errData && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0]
      const msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]
      error.value = `${firstKey}: ${msg}`
    } else {
      error.value = e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || t('auth.register_failed')
    }
  } finally {
    loading.value = false
  }
}
</script>
