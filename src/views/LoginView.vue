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
          <div style="font-size:2.5rem; margin-bottom:0.5rem">⚡</div>
          <h1 class="navbar-brand-text" style="font-size:2rem; -webkit-text-fill-color:unset; background:linear-gradient(135deg,var(--tf-primary),var(--tf-secondary)); -webkit-background-clip:text; -webkit-text-fill-color:transparent">
            {{ t('nav.brand') }}
          </h1>
          <p class="text-muted" style="font-size:0.875rem; margin-top:0.25rem">Employee-Centered Task Management</p>
        </div>

        <!-- Card -->
        <div class="tf-card" style="padding:2rem">
          <h2 class="mb-1" style="font-size:1.1rem; font-weight:700">{{ t('dashboard.welcome') }}</h2>
          <p class="text-muted mb-4" style="font-size:0.82rem">Sign in to your account to continue</p>

          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label class="tf-label">Username</label>
              <input
                v-model="form.username"
                id="username"
                type="text"
                class="form-control tf-input"
                placeholder="Enter your username"
                autocomplete="username"
                required
              />
            </div>
            <div class="mb-4">
              <label class="tf-label">Password</label>
              <input
                v-model="form.password"
                id="password"
                type="password"
                class="form-control tf-input"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />
            </div>

            <div v-if="error" class="alert alert-danger py-2 mb-3" style="font-size:0.82rem">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
            </div>

            <button
              type="submit"
              class="btn btn-tf-primary w-100"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-box-arrow-in-right me-2"></i>
              Sign In
            </button>
          </form>

          <div class="divider mt-4"></div>
          <div class="text-center">
            <div class="text-muted small mb-2">Quick Sign-in:</div>
            <div class="d-flex gap-2 justify-content-center flex-wrap">
              <button class="btn btn-xs btn-tf-ghost" style="font-size:0.75rem; padding:0.25rem 0.6rem" @click="quickLogin('ahmed', 'ahmed123')">
                Ahmed
              </button>
              <button class="btn btn-xs btn-tf-ghost" style="font-size:0.75rem; padding:0.25rem 0.6rem" @click="quickLogin('mohammed', 'mohammed123')">
                Mohammed
              </button>
              <button class="btn btn-xs btn-tf-ghost" style="font-size:0.75rem; padding:0.25rem 0.6rem" @click="quickLogin('khaled', 'khaled123')">
                Khaled
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center p-3 text-muted small">
      TaskFlow MVP &bull; Employee-Centered Workflow
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const { t, locale, setLocale } = useI18n()
const { theme, themes, setTheme } = useTheme()

const currentThemeObj = computed(() => themes.find(th => th.id === theme.value) || themes[0])

const form    = ref({ username: '', password: '' })
const loading = ref(false)
const error   = ref('')

function quickLogin(u, p) {
  form.value.username = u
  form.value.password = p
  handleLogin()
}

async function handleLogin() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await authApi.login(form.value.username, form.value.password)
    auth.setAuth(data.token, data.user)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = e.response?.data?.detail || e.response?.data?.error || e.response?.data?.non_field_errors?.[0] || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>
