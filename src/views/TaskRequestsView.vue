<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-envelope-arrow-up me-2"></i>Task Requests</h1>
      <p class="page-subtitle">Requests you've sent and received</p>
    </div>

    <!-- Tab -->
    <div class="d-flex gap-2 mb-4">
      <button :class="['btn btn-sm', tab === 'received' ? 'btn-tf-primary' : 'btn-tf-ghost']" @click="tab = 'received'">
        <i class="bi bi-inbox me-1"></i>Received ({{ received.length }})
      </button>
      <button :class="['btn btn-sm', tab === 'sent' ? 'btn-tf-primary' : 'btn-tf-ghost']" @click="tab = 'sent'">
        <i class="bi bi-send me-1"></i>Sent ({{ sent.length }})
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
              <button class="btn btn-sm btn-tf-primary" @click="accept(req.id)">Accept</button>
              <button class="btn btn-sm btn-tf-ghost" @click="reject(req.id)">Reject</button>
            </template>
            <span v-else :class="['status-badge', `status-${req.status.toLowerCase()}`]">{{ req.status }}</span>
          </template>
        </RequestCard>
      </div>
      <div v-else class="empty-state">
        <i class="bi bi-inbox"></i><p>No received requests.</p>
      </div>
    </div>

    <!-- Sent Requests -->
    <div v-else>
      <div v-if="sent.length">
        <RequestCard v-for="req in sent" :key="req.id" :request="req">
          <template #actions>
            <button v-if="req.status === 'PENDING'" class="btn btn-sm btn-tf-ghost" @click="cancel(req.id)">
              Cancel
            </button>
            <span v-else :class="['status-badge', `status-${req.status.toLowerCase()}`]">{{ req.status }}</span>
          </template>
        </RequestCard>
      </div>
      <div v-else class="empty-state">
        <i class="bi bi-send"></i><p>No sent requests.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { taskRequestsApi } from '@/api/taskRequests'
import { useToast } from '@/composables/useToast'
import RequestCard from '@/components/RequestCard.vue'

const toast   = useToast()
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
  } catch { toast.error('Failed to load requests') }
  finally { loading.value = false }
}

async function accept(id) {
  try { await taskRequestsApi.accept(id); toast.success('Request accepted!'); load() }
  catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

async function reject(id) {
  try { await taskRequestsApi.reject(id); toast.info('Request rejected'); load() }
  catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

async function cancel(id) {
  try { await taskRequestsApi.cancel(id); toast.info('Request cancelled'); load() }
  catch (e) { toast.error(e.response?.data?.error || 'Failed') }
}

onMounted(load)
</script>
