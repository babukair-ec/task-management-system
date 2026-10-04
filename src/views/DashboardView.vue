<template>
  <div>
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="page-title">{{ t('dashboard.title') }}</h1>
        <p class="page-subtitle">{{ t('dashboard.welcome') }}, {{ auth.user?.full_name || auth.user?.display_name || auth.user?.username }} 👋</p>
      </div>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary">
        <i class="bi bi-plus-lg me-2"></i>{{ t('tasks.create_btn') }}
      </RouterLink>
    </div>

    <!-- Stat Cards -->
    <div class="row g-3 mb-4" v-if="!loading">
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15); color:#fbbf24">
            <i class="bi bi-play-circle"></i>
          </div>
          <div>
            <div class="stat-value">{{ data.my_active_tasks?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.active_tasks') }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15); color:#f87171">
            <i class="bi bi-exclamation-octagon"></i>
          </div>
          <div>
            <div class="stat-value">{{ data.my_blocked_tasks?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.blocked_tasks') }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(6,182,212,0.15); color:#22d3ee">
            <i class="bi bi-collection"></i>
          </div>
          <div>
            <div class="stat-value">{{ data.available_tasks?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.available_tasks') }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15); color:#a5b4fc">
            <i class="bi bi-envelope-arrow-up"></i>
          </div>
          <div>
            <div class="stat-value">{{ data.pending_requests?.length || 0 }}</div>
            <div class="stat-label">{{ t('dashboard.pending_requests') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
      <span>Loading dashboard…</span>
    </div>

    <div v-else class="row g-4">
      <!-- Active Tasks -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header"><i class="bi bi-play-circle"></i>{{ t('dashboard.active_tasks') }}</div>
        <div v-if="data.my_active_tasks?.length">
          <TaskCard v-for="t in data.my_active_tasks" :key="t.id" :task="t" class="mb-2" />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <p>{{ t('dashboard.no_active') }}</p>
        </div>
      </div>

      <!-- Blocked Tasks -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header"><i class="bi bi-exclamation-octagon text-danger"></i>{{ t('dashboard.blocked_tasks') }}</div>
        <div v-if="data.my_blocked_tasks?.length">
          <TaskCard v-for="t in data.my_blocked_tasks" :key="t.id" :task="t" class="mb-2" />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <p>{{ t('dashboard.no_blocked') }}</p>
        </div>
      </div>

      <!-- Available to Claim -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header"><i class="bi bi-collection"></i>{{ t('dashboard.available_tasks') }}</div>
        <div v-if="data.available_tasks?.length">
          <TaskCard v-for="t in data.available_tasks" :key="t.id" :task="t" class="mb-2" />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <p>{{ t('dashboard.no_available') }}</p>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="col-12 col-xl-6">
        <div class="tf-card-header"><i class="bi bi-envelope-arrow-up"></i>{{ t('dashboard.pending_requests') }}</div>
        <div v-if="data.pending_requests?.length">
          <RequestCard
            v-for="req in data.pending_requests"
            :key="req.id"
            :request="req"
          >
            <template #actions>
              <button class="btn btn-sm btn-tf-primary me-2" @click="acceptReq(req.id)">{{ t('dashboard.accept_btn') }}</button>
              <button class="btn btn-sm btn-tf-ghost" @click="rejectReq(req.id)">{{ t('dashboard.reject_btn') }}</button>
            </template>
          </RequestCard>
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <p>{{ t('dashboard.no_requests') }}</p>
        </div>
      </div>

      <!-- Recently Completed -->
      <div class="col-12">
        <div class="tf-card-header"><i class="bi bi-check-circle text-success"></i>{{ t('dashboard.recently_completed') }}</div>
        <div v-if="data.recently_completed?.length">
          <TaskCard v-for="t in data.recently_completed" :key="t.id" :task="t" class="mb-2" />
        </div>
        <div v-else class="empty-state" style="padding:1.5rem">
          <p>{{ t('dashboard.no_completed') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { employeesApi } from '@/api/employees'
import { taskRequestsApi } from '@/api/taskRequests'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import TaskCard from '@/components/TaskCard.vue'
import RequestCard from '@/components/RequestCard.vue'

const auth   = useAuthStore()
const toast  = useToast()
const { t }  = useI18n()
const loading = ref(true)
const data    = ref({})

async function load() {
  loading.value = true
  try {
    const { data: d } = await employeesApi.dashboard()
    data.value = d
  } catch {
    toast.error('Failed to load dashboard')
  } finally {
    loading.value = false
  }
}

async function acceptReq(id) {
  try {
    await taskRequestsApi.accept(id)
    toast.success('Request accepted — task assigned to you!')
    load()
  } catch (e) {
    toast.error(e.response?.data?.error || 'Failed to accept')
  }
}

async function rejectReq(id) {
  try {
    await taskRequestsApi.reject(id)
    toast.info('Request rejected')
    load()
  } catch (e) {
    toast.error(e.response?.data?.error || 'Failed to reject')
  }
}

onMounted(load)
</script>
