<template>
  <div class="tf-card mb-2">
    <div class="d-flex align-items-center gap-3">
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <TaskStatus :status="request.status" />
          <span class="fw-semibold text-truncate">{{ request.task_title || request.task?.title || 'Task Request' }}</span>
        </div>
        <div class="d-flex gap-3 flex-wrap" style="font-size:0.78rem; color:var(--tf-text-muted)">
          <span><i class="bi bi-person me-1"></i>From: {{ request.requester_detail?.display_name || request.requester_detail?.username || request.requester?.full_name || request.requester?.username || request.requester_id }}</span>
          <span><i class="bi bi-person-arrow-right me-1"></i>To: {{ request.requested_employee_detail?.display_name || request.requested_employee_detail?.username || request.requested_employee?.full_name || request.requested_employee?.username || request.requested_employee_id }}</span>
          <span><i class="bi bi-clock me-1"></i>{{ timeAgo(request.created_at || request.createdAt) }}</span>
        </div>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import TaskStatus from './TaskStatus.vue'
import { timeAgo } from '@/utils/formatters'

defineProps({
  request: { type: Object, required: true },
})
</script>
