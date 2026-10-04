<template>
  <div>
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="page-title">{{ t('tasks.my_tasks_title') }}</h1>
        <p class="page-subtitle">{{ t('tasks.my_tasks_subtitle') }}</p>
      </div>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary">
        <i class="bi bi-plus-lg me-2"></i>{{ t('tasks.create_btn') }}
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <button
        v-for="f in filterList"
        :key="f.value"
        :class="['btn btn-sm', activeFilter === f.value ? 'btn-tf-primary' : 'btn-tf-ghost']"
        @click="setFilter(f.value)"
      >{{ f.label }}</button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <div v-else-if="tasks.length">
      <TaskCard v-for="t in tasks" :key="t.id" :task="t" class="mb-2" />
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>{{ t('tasks.no_tasks') }}</p>
      <RouterLink to="/tasks/create" class="btn btn-tf-primary btn-sm">{{ t('tasks.create_btn') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import TaskCard from '@/components/TaskCard.vue'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const tasks  = ref([])
const loading = ref(false)
const activeFilter = ref('all')

const filterList = computed(() => [
  { value: 'all',         label: t('tasks.filter_all') },
  { value: 'ASSIGNED',    label: t('tasks.filter_assigned') },
  { value: 'IN_PROGRESS', label: t('tasks.filter_in_progress') },
  { value: 'BLOCKED',     label: t('tasks.filter_blocked') },
  { value: 'COMPLETED',   label: t('tasks.filter_completed') },
  { value: 'DRAFT',       label: t('status.DRAFT') },
])

async function load() {
  loading.value = true
  try {
    const employeeId = auth.employee?.id || auth.user?.id
    const params = { owner_id: employeeId }
    if (activeFilter.value !== 'all') {
      params.status = activeFilter.value
    }
    const { data } = await tasksApi.list(params)
    tasks.value = data || []
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
