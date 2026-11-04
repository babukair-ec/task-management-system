<template>
  <div>
    <!-- Page Header -->
    <div class="page-header mb-4">
      <h1 class="page-title">{{ t('dashboard.title') }}</h1>
    </div>

    <!-- Stat Cards -->
    <div class="row g-3 mb-4" v-if="!loading">
      <!-- 1. Tasks in Progress (المهام قيد التنفيذ) -->
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15); color:#fbbf24">
            <i class="bi bi-play-circle"></i>
          </div>
          <div>
            <div class="stat-value">{{ data?.my_active_tasks?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.active_tasks') }}</div>
          </div>
        </div>
      </div>

      <!-- 2. Remaining Tasks (المهام المتبقية) -->
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.15); color:#3b82f6">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div>
            <div class="stat-value">{{ data?.remaining_tasks_count ?? 0 }}</div>
            <div class="stat-label">{{ t('dashboard.remaining_tasks') }}</div>
          </div>
        </div>
      </div>

      <!-- 3. Blocked / Pending Tasks (المهام المعلقة) -->
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15); color:#f87171">
            <i class="bi bi-exclamation-octagon"></i>
          </div>
          <div>
            <div class="stat-value">{{ data?.my_blocked_tasks?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.blocked_tasks') }}</div>
          </div>
        </div>
      </div>

      <!-- 4. Completed Tasks (المهام المكتملة) -->
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15); color:#10b981">
            <i class="bi bi-check2-circle"></i>
          </div>
          <div>
            <div class="stat-value">{{ data?.completed_tasks_count ?? 0 }}</div>
            <div class="stat-label">{{ t('dashboard.completed_tasks') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Tasks Grid -->
    <div v-else class="row g-4">
      <!-- Active Tasks -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-play-circle text-warning"></i>
            <span>{{ t('dashboard.active_tasks') }}</span>
          </div>
          <span class="badge bg-secondary-subtle text-secondary py-1 px-2" style="font-size:0.7rem">
            {{ data?.my_active_tasks?.length || 0 }}
          </span>
        </div>
        <div v-if="data?.my_active_tasks?.length">
          <TaskCard
            v-for="t in data?.my_active_tasks"
            :key="t.id || t.outer_id"
            :task="t"
            class="mb-2"
            @status-changed="load"
          />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <i class="bi bi-inbox"></i>
          <p>{{ t('dashboard.no_active') }}</p>
        </div>
      </div>

      <!-- Blocked Tasks -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-exclamation-octagon text-danger"></i>
            <span>{{ t('dashboard.blocked_tasks') }}</span>
          </div>
          <span class="badge bg-danger-subtle text-danger py-1 px-2" style="font-size:0.7rem">
            {{ data?.my_blocked_tasks?.length || 0 }}
          </span>
        </div>
        <div v-if="data?.my_blocked_tasks?.length">
          <TaskCard
            v-for="t in data?.my_blocked_tasks"
            :key="t.id || t.outer_id"
            :task="t"
            class="mb-2"
            @status-changed="load"
          />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <i class="bi bi-shield-check"></i>
          <p>{{ t('dashboard.no_blocked') }}</p>
        </div>
      </div>

      <!-- Draft Tasks (if any) -->
      <div class="col-12 col-xl-6" v-if="data?.my_draft_tasks?.length">
        <div class="tf-card-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-pencil text-muted"></i>
            <span>{{ t('status.DRAFT') }}</span>
          </div>
          <span class="badge bg-secondary-subtle text-secondary py-1 px-2" style="font-size:0.7rem">
            {{ data?.my_draft_tasks?.length }}
          </span>
        </div>
        <div>
          <TaskCard
            v-for="t in data?.my_draft_tasks"
            :key="t.id || t.outer_id"
            :task="t"
            class="mb-2"
            @status-changed="load"
          />
        </div>
      </div>

      <!-- Recently Completed -->
      <div :class="data?.my_draft_tasks?.length ? 'col-12 col-xl-6' : 'col-12'">
        <div class="tf-card-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle text-success"></i>
            <span>{{ t('dashboard.recently_completed') }}</span>
          </div>
          <span class="badge bg-success-subtle text-success py-1 px-2" style="font-size:0.7rem">
            {{ data?.recently_completed?.length || 0 }}
          </span>
        </div>
        <div v-if="data?.recently_completed?.length">
          <TaskCard
            v-for="t in data?.recently_completed"
            :key="t.id || t.outer_id"
            :task="t"
            class="mb-2"
            @status-changed="load"
          />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <i class="bi bi-clock-history"></i>
          <p>{{ t('dashboard.no_completed') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { employeesApi } from '@/api/employees'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const TaskCard = defineAsyncComponent(() => import('@/components/TaskCard.vue'))

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const loading = ref(true)
const data = ref({})

async function load() {
  loading.value = true
  try {
    const res = await employeesApi.dashboard()
    data.value = res?.data || res || {}
  } catch (err) {
    toast.error(err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to load dashboard')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
