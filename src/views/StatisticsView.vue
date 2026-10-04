<template>
  <div>
    <!-- Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="page-title">
          <i class="bi bi-graph-up-arrow me-2 text-primary"></i>{{ t('statistics.title') }}
        </h1>
        <p class="page-subtitle">{{ t('statistics.subtitle') }}</p>
      </div>
      <button class="btn btn-sm btn-tf-ghost" @click="fetchData" :disabled="loading">
        <i class="bi bi-arrow-clockwise me-1" :class="{ 'spin-icon': loading }"></i>
        {{ t('statistics.refresh') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border spinner-border-sm text-primary"></div>
      <span>Loading statistics...</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
    </div>

    <div v-else>
      <!-- KPI Top Summary Cards -->
      <div class="row g-3 mb-4">
        <!-- 1. Total Tasks -->
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99,102,241,0.15); color: #818cf8">
              <i class="bi bi-layers-fill"></i>
            </div>
            <div>
              <div class="stat-value">{{ data.total_tasks || 0 }}</div>
              <div class="stat-label">{{ t('reports.total_tasks') }}</div>
            </div>
          </div>
        </div>

        <!-- 2. Completion Rate -->
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16,185,129,0.15); color: #34d399">
              <i class="bi bi-check-circle-fill"></i>
            </div>
            <div>
              <div class="stat-value">{{ data.completion_rate || 0 }}%</div>
              <div class="stat-label">{{ t('reports.completion_rate') }}</div>
            </div>
          </div>
        </div>

        <!-- 3. Blocked Tasks -->
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239,68,68,0.15); color: #f87171">
              <i class="bi bi-exclamation-octagon-fill"></i>
            </div>
            <div>
              <div class="stat-value">{{ data.status_counts?.blocked || 0 }}</div>
              <div class="stat-label">{{ t('reports.active_blocked') }}</div>
            </div>
          </div>
        </div>

        <!-- 4. Avg Completion Time -->
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245,158,11,0.15); color: #fbbf24">
              <i class="bi bi-stopwatch-fill"></i>
            </div>
            <div>
              <div class="stat-value">
                {{ data.avg_completion_hours || 0 }}
                <span style="font-size: 0.9rem; font-weight: 500; color: var(--tf-text-muted)">{{ t('reports.hours') }}</span>
              </div>
              <div class="stat-label">{{ t('reports.avg_completion_time') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Distributions: Status & Priority -->
      <div class="row g-4 mb-4">
        <!-- Status Breakdown -->
        <div class="col-lg-6">
          <div class="tf-card h-100">
            <div class="tf-card-header">
              <i class="bi bi-pie-chart-fill text-primary"></i>
              {{ t('reports.status_distribution') }}
            </div>

            <div class="d-flex flex-column gap-3 mt-2">
              <div v-for="item in statusRows" :key="item.key">
                <div class="report-metric-row">
                  <div class="d-flex align-items-center gap-2">
                    <span class="status-badge" :class="item.badgeClass">{{ t(`status.${item.statusKey}`) }}</span>
                  </div>
                  <div class="text-muted small">
                    <span class="fw-bold" style="color: var(--tf-text)">{{ item.count }}</span>
                    ({{ getPct(item.count, data.total_tasks) }}%)
                  </div>
                </div>
                <div class="report-progress-wrap">
                  <div
                    class="report-progress-bar"
                    :style="{
                      width: `${getPct(item.count, data.total_tasks)}%`,
                      backgroundColor: item.color
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority Breakdown & Problem Health -->
        <div class="col-lg-6">
          <div class="tf-card h-100">
            <div class="tf-card-header">
              <i class="bi bi-flag-fill text-warning"></i>
              {{ t('reports.priority_distribution') }}
            </div>

            <div class="d-flex flex-column gap-3 mt-2">
              <div v-for="p in priorityRows" :key="p.key">
                <div class="report-metric-row">
                  <span class="status-badge" :class="p.badgeClass">{{ t(`priorities.${p.key}`) }}</span>
                  <div class="text-muted small">
                    <span class="fw-bold" style="color: var(--tf-text)">{{ p.count }}</span>
                    ({{ getPct(p.count, data.total_tasks) }}%)
                  </div>
                </div>
                <div class="report-progress-wrap">
                  <div
                    class="report-progress-bar"
                    :style="{
                      width: `${getPct(p.count, data.total_tasks)}%`,
                      backgroundColor: p.color
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Problem Health Block inside right column -->
            <div class="divider"></div>
            <div class="tf-card-header mt-3">
              <i class="bi bi-shield-exclamation text-danger"></i>
              {{ t('reports.problem_metrics') }}
            </div>
            <div class="row g-2 text-center mt-1">
              <div class="col-4">
                <div class="p-2 rounded" style="background: var(--tf-surface-3)">
                  <div class="fw-bold fs-5" style="color: var(--tf-text)">{{ data.total_problems || 0 }}</div>
                  <div class="small text-muted">{{ t('reports.total_problems') }}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2 rounded" style="background: var(--tf-surface-3)">
                  <div class="fw-bold fs-5 text-success">{{ data.problem_resolution_rate || 0 }}%</div>
                  <div class="small text-muted">{{ t('reports.problem_resolution_rate') }}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2 rounded" style="background: var(--tf-surface-3)">
                  <div class="fw-bold fs-5 text-warning">{{ data.avg_problem_resolution_hours || 0 }}h</div>
                  <div class="small text-muted">{{ t('reports.avg_resolution_time') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Workload Table -->
      <div class="tf-card">
        <div class="tf-card-header">
          <i class="bi bi-people-fill text-info"></i>
          {{ t('reports.employee_workload') }}
        </div>

        <div class="table-responsive">
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t('reports.col_employee') }}</th>
                <th>{{ t('reports.col_department') }}</th>
                <th class="text-center">{{ t('reports.col_created') }}</th>
                <th class="text-center">{{ t('reports.col_active') }}</th>
                <th class="text-center">{{ t('reports.col_completed') }}</th>
                <th class="text-center">{{ t('reports.col_reported') }}</th>
                <th class="text-center">{{ t('reports.col_resolved') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in (data.employee_stats || [])" :key="emp.id">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar">{{ initials(emp.display_name || emp.username) }}</div>
                    <div>
                      <span class="fw-600">{{ emp.display_name || emp.username }}</span>
                      <div class="small text-muted">@{{ emp.username }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge bg-secondary-subtle text-secondary-emphasis">{{ emp.department || 'General' }}</span></td>
                <td class="text-center fw-600">{{ emp.tasks_created }}</td>
                <td class="text-center">
                  <span class="badge" :class="emp.tasks_active > 0 ? 'bg-primary' : 'bg-dark text-muted'">
                    {{ emp.tasks_active }}
                  </span>
                </td>
                <td class="text-center text-success fw-bold">{{ emp.tasks_completed }}</td>
                <td class="text-center text-warning fw-600">{{ emp.problems_reported }}</td>
                <td class="text-center text-info fw-bold">{{ emp.problems_resolved }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reportsApi } from '@/api/reports'
import { useI18n } from '@/composables/useI18n'
import { initials } from '@/utils/formatters'

const { t } = useI18n()

const loading = ref(true)
const error = ref(null)
const data = ref({
  total_tasks: 0,
  status_counts: { draft: 0, available: 0, assigned: 0, in_progress: 0, blocked: 0, completed: 0, cancelled: 0 },
  priority_counts: { low: 0, medium: 0, high: 0, urgent: 0 },
  completion_rate: 0,
  avg_completion_hours: 0,
  total_problems: 0,
  problem_counts: { open: 0, in_progress: 0, resolved: 0, cancelled: 0 },
  problem_resolution_rate: 0,
  avg_problem_resolution_hours: 0,
  employee_stats: [],
})

const statusRows = computed(() => {
  const counts = data.value.status_counts || {}
  return [
    { key: 'in_progress', statusKey: 'IN_PROGRESS', count: counts.in_progress || 0, color: '#fbbf24', badgeClass: 'status-in_progress' },
    { key: 'blocked',     statusKey: 'BLOCKED',     count: counts.blocked || 0,     color: '#f87171', badgeClass: 'status-blocked' },
    { key: 'available',   statusKey: 'AVAILABLE',   count: counts.available || 0,   color: '#22d3ee', badgeClass: 'status-available' },
    { key: 'assigned',    statusKey: 'ASSIGNED',    count: counts.assigned || 0,    color: '#a5b4fc', badgeClass: 'status-assigned' },
    { key: 'completed',   statusKey: 'COMPLETED',   count: counts.completed || 0,   color: '#34d399', badgeClass: 'status-completed' },
    { key: 'draft',       statusKey: 'DRAFT',       count: counts.draft || 0,       color: '#94a3b8', badgeClass: 'status-draft' },
    { key: 'cancelled',   statusKey: 'CANCELLED',   count: counts.cancelled || 0,   color: '#64748b', badgeClass: 'status-cancelled' },
  ]
})

const priorityRows = computed(() => {
  const pcounts = data.value.priority_counts || {}
  return [
    { key: 'URGENT', count: pcounts.urgent || 0, color: '#ef4444', badgeClass: 'priority-urgent' },
    { key: 'HIGH',   count: pcounts.high || 0,   color: '#f59e0b', badgeClass: 'priority-high' },
    { key: 'MEDIUM', count: pcounts.medium || 0, color: '#06b6d4', badgeClass: 'priority-medium' },
    { key: 'LOW',    count: pcounts.low || 0,    color: '#10b981', badgeClass: 'priority-low' },
  ]
})

function getPct(count, total) {
  if (!total || total === 0) return 0
  return Math.round(((count || 0) / total) * 100)
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const res = await reportsApi.getSummary()
    data.value = res.data
  } catch (err) {
    error.value = err.response?.data?.detail || err.message || 'Failed to load statistics'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
