<template>
  <nav class="app-navbar">
    <span class="navbar-brand-text">
      <i class="bi bi-lightning-charge-fill me-1"></i>{{ t('nav.brand') }}
    </span>

    <div class="ms-auto d-flex align-items-center gap-2">
      <!-- 1. Language Switcher -->
      <div class="dropdown">
        <button
          class="btn btn-sm btn-tf-ghost dropdown-toggle d-flex align-items-center gap-1"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-translate text-primary"></i>
          <span class="d-none d-sm-inline">{{ locale === 'ar' ? 'العربية' : 'English' }}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow" :class="{ 'dropdown-menu-start': isRTL }">
          <li>
            <button
              class="dropdown-item d-flex align-items-center justify-content-between"
              :class="{ 'active': locale === 'en' }"
              @click="setLocale('en')"
            >
              <span>🇺🇸 English</span>
              <i v-if="locale === 'en'" class="bi bi-check2 text-primary"></i>
            </button>
          </li>
          <li>
            <button
              class="dropdown-item d-flex align-items-center justify-content-between"
              :class="{ 'active': locale === 'ar' }"
              @click="setLocale('ar')"
            >
              <span>🇸🇦 العربية</span>
              <i v-if="locale === 'ar'" class="bi bi-check2 text-primary"></i>
            </button>
          </li>
        </ul>
      </div>

      <!-- 2. Theme Switcher (5 Themes) -->
      <div class="dropdown">
        <button
          class="btn btn-sm btn-tf-ghost dropdown-toggle d-flex align-items-center gap-2"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          :title="t('themes.title')"
        >
          <i :class="['bi', currentThemeObj?.icon, 'text-warning']"></i>
          <span class="d-none d-md-inline">{{ t(`themes.${theme}`) }}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow" :class="{ 'dropdown-menu-start': isRTL }">
          <li class="dropdown-header small text-uppercase text-muted">{{ t('themes.title') }}</li>
          <li v-for="th in themes" :key="th.id">
            <button
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              :class="{ 'active': theme === th.id }"
              @click="setTheme(th.id)"
            >
              <div class="d-flex align-items-center gap-2">
                <i :class="['bi', th.icon]"></i>
                <span>{{ t(`themes.${th.id}`) }}</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <span
                  v-for="(col, idx) in th.colors"
                  :key="idx"
                  class="theme-preview-dot"
                  :style="{ backgroundColor: col }"
                ></span>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <div class="vr mx-1 opacity-25 d-none d-sm-block" style="height: 20px;"></div>

      <!-- Current User info -->
      <RouterLink to="/profile" class="btn btn-sm btn-tf-ghost text-muted small d-none d-sm-flex align-items-center" :title="t('nav.profile')">
        <i class="bi bi-person-circle me-1 text-primary"></i>
        <span>{{ auth.user?.full_name || auth.user?.display_name || auth.user?.username }}</span>
      </RouterLink>

      <!-- Logout button -->
      <button class="btn btn-sm btn-tf-ghost" @click="logout" :title="t('nav.logout')">
        <i class="bi bi-box-arrow-right me-1"></i>
        <span class="d-none d-sm-inline">{{ t('nav.logout') }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'
import { authApi } from '@/api/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { useTheme } from '@/composables/useTheme'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { t, locale, isRTL, setLocale } = useI18n()
const { theme, themes, setTheme } = useTheme()

const currentThemeObj = computed(() => themes.find(th => th.id === theme.value) || themes[0])

async function logout() {
  try { await authApi.logout() } catch {}
  auth.clearAuth()
  router.push('/login')
  toast.info('Logged out')
}
</script>
