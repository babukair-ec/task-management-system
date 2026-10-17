<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-collection me-2"></i>{{ t('tasks.available_title') }}</h1>
      <p class="page-subtitle">{{ t('tasks.available_subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <div v-else-if="tasks.length" class="d-flex flex-column gap-2">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="tf-card d-flex align-items-center gap-3"
      >
        <div class="flex-grow-1">
          <RouterLink :to="`/tasks/${task.id}`" class="fw-semibold text-decoration-none" style="color:var(--tf-text)">
            {{ task.title }}
          </RouterLink>
          <div class="mt-1 d-flex gap-3 flex-wrap" style="font-size:0.78rem; color:var(--tf-text-muted)">
            <span><i class="bi bi-person me-1"></i>{{ task.creator_detail?.display_name || task.creator_detail?.username || task.creator?.full_name || task.creator?.username || task.creator_id }}</span>
            <span v-if="task.due_date"><i class="bi bi-calendar3 me-1"></i>{{ formatDate(task.due_date) }}</span>
            <span :class="['status-badge', `priority-${task.priority?.toLowerCase()}`]" style="font-size:0.65rem">{{ t(`priorities.${task.priority}`, task.priority) }}</span>
          </div>
        </div>
        <button
          class="btn btn-tf-primary btn-sm flex-shrink-0"
          :disabled="claiming === task.id"
          @click="claimTask(task.id)"
        >
          <span v-if="claiming === task.id" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-hand-index me-1"></i>
          {{ t('dashboard.claim_btn') }}
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-collection"></i>
      <p>{{ t('dashboard.no_available') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'
import { formatDate } from '@/utils/formatters'

const toast   = useToast()
const router  = useRouter()
const { t }   = useI18n()
const tasks   = ref([])
const loading = ref(true)
const claiming = ref(null)

async function load() {
  loading.value = true
  try {
    const { data } = await tasksApi.available()
    tasks.value = data || []
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to load available tasks')
  } finally {
    loading.value = false
  }
}

async function claimTask(id) {
  claiming.value = id
  try {
    await tasksApi.claim(id)
    toast.success(t('tasks.claim_success'))
    router.push(`/tasks/${id}`)
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to claim task')
    load()
  } finally {
    claiming.value = null
  }
}

onMounted(load)
</script>
