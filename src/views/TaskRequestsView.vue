<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-envelope-arrow-up me-2"></i>{{ t('task_requests_view.title') }}</h1>
      <p class="page-subtitle">{{ t('task_requests_view.subtitle') }}</p>
    </div>

    <!-- Tab -->
    <div class="d-flex gap-2 mb-4">
      <button :class="['btn btn-sm', tab === 'received' ? 'btn-tf-primary' : 'btn-tf-ghost']" @click="tab = 'received'">
        <i class="bi bi-inbox me-1"></i>{{ t('task_requests_view.received_tab') }} ({{ received.length }})
      </button>
      <button :class="['btn btn-sm', tab === 'sent' ? 'btn-tf-primary' : 'btn-tf-ghost']" @click="tab = 'sent'">
        <i class="bi bi-send me-1"></i>{{ t('task_requests_view.sent_tab') }} ({{ sent.length }})
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <!-- Received Requests -->
    <div v-else-if="tab === 'received'">
      <div v-if="received.length">
        <RequestCard v-for="req in received" :key="req.id" :request="req">
          <template #actions>
            <template v-if="req.status === 'PENDING'">
              <button class="btn btn-sm btn-tf-primary" @click="accept(req.id)">{{ t('task_requests_view.accept') }}</button>
              <button class="btn btn-sm btn-tf-ghost" @click="reject(req.id)">{{ t('task_requests_view.reject') }}</button>
            </template>
            <span v-else :class="['status-badge', `status-${req.status.toLowerCase()}`]">{{ req.status }}</span>
          </template>
        </RequestCard>
      </div>
      <div v-else class="empty-state">
        <i class="bi bi-inbox"></i><p>{{ t('task_requests_view.no_received') }}</p>
      </div>
    </div>

    <!-- Sent Requests -->
    <div v-else>
      <div v-if="sent.length">
        <RequestCard v-for="req in sent" :key="req.id" :request="req">
          <template #actions>
            <button v-if="req.status === 'PENDING'" class="btn btn-sm btn-tf-ghost" @click="cancel(req.id)">
              {{ t('task_requests_view.cancel') }}
            </button>
            <span v-else :class="['status-badge', `status-${req.status.toLowerCase()}`]">{{ req.status }}</span>
          </template>
        </RequestCard>
      </div>
      <div v-else class="empty-state">
        <i class="bi bi-send"></i><p>{{ t('task_requests_view.no_sent') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { taskRequestsApi } from '@/api/taskRequests'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/composables/useI18n'

const RequestCard = defineAsyncComponent(() => import('@/components/RequestCard.vue'))

const toast   = useToast()
const { t }   = useI18n()
const loading = ref(true)
const tab     = ref('received')
const received = ref([])
const sent     = ref([])

async function load() {
  loading.value = true
  try {
    const [r, s] = await Promise.all([taskRequestsApi.received(), taskRequestsApi.sent()])
    received.value = r.data
    sent.value     = s.data
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed to load requests')
  } finally {
    loading.value = false
  }
}

async function accept(id) {
  try {
    await taskRequestsApi.accept(id)
    toast.success(t('task_requests_view.request_accepted'))
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

async function reject(id) {
  try {
    await taskRequestsApi.reject(id)
    toast.info(t('task_requests_view.request_rejected'))
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

async function cancel(id) {
  try {
    await taskRequestsApi.cancel(id)
    toast.info(t('task_requests_view.request_cancelled'))
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Failed')
  }
}

onMounted(load)
</script>
