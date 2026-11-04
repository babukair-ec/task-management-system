<template>
  <div>
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="page-title">{{ t('tasks.title') }}</h1>
      </div>
      <div class="d-flex align-items-center gap-2">
        <!-- Refresh Button -->
        <button
          class="btn btn-sm btn-tf-ghost"
          :disabled="loading"
          @click="load"
          :title="t('employees.refresh')"
        >
          <i :class="['bi bi-arrow-clockwise', { 'spin-animation': loading }]"></i>
        </button>

        <!-- Create Task Link -->
        <RouterLink to="/tasks/create" class="btn btn-tf-primary">
          <i class="bi bi-plus-lg me-2"></i>{{ t('tasks.create_task') }}
        </RouterLink>
      </div>
    </div>

    <!-- Filters (Demo Style) -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <button
        v-for="f in filterList"
        :key="f.value"
        :class="['btn btn-sm', activeFilter === f.value ? 'btn-tf-primary' : 'btn-tf-ghost']"
        @click="setFilter(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <!-- Task List (Demo Style) -->
    <div v-else-if="tasks.length">
      <TaskCard
        v-for="t in tasks"
        :key="t.id || t.outer_id"
        :task="t"
        class="mb-2"
        @status-changed="load"
      />
    </div>

    <!-- Empty State (Demo Style) -->
    <div v-else class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>{{ t('tasks.no_tasks') }}</p>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary btn-sm">
        {{ t('tasks.create_task') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import TaskCard from '@/components/TaskCard.vue'

const toast = useToast()
const { t } = useI18n()

const tasks = ref([])
const loading = ref(false)
const activeFilter = ref('all')

const filterList = computed(() => [
  { value: 'all',         label: t('tasks.filter_all') },
  { value: 'ASSIGNED',    label: t('status.ASSIGNED') },
  { value: 'IN_PROGRESS', label: t('status.IN_PROGRESS') },
  { value: 'BLOCKED',     label: t('status.BLOCKED') },
  { value: 'COMPLETED',   label: t('status.COMPLETED') },
  { value: 'DRAFT',       label: t('status.DRAFT') },
  { value: 'CANCELLED',   label: t('status.CANCELLED') },
])

async function load() {
  loading.value = true
  try {
    const params = {}
    if (activeFilter.value !== 'all') {
      params.status = activeFilter.value
    }
    const res = await tasksApi.listTasks(params)
    tasks.value = Array.isArray(res.data) ? res.data : (res.data?.results || [])
  } catch {
    toast.error('Failed to load tasks')
  } finally {
    loading.value = false
  }
}

function setFilter(v) {
  activeFilter.value = v
}

watch(activeFilter, load)
onMounted(load)
</script>

<style scoped>
.spin-animation {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>