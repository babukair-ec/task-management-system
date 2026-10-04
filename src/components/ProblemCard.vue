<template>
  <div class="tf-card mb-2">
    <div class="d-flex align-items-start gap-3">
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <TaskStatus :status="problem.status" />
          <span class="text-muted small">{{ formatDateTime(problem.created_at || problem.createdAt) }}</span>
        </div>
        <p class="mb-2" style="font-size:0.9rem">{{ problem.description }}</p>
        <div class="d-flex gap-3 flex-wrap" style="font-size:0.78rem; color:var(--tf-text-muted)">
          <span><i class="bi bi-person-exclamation me-1"></i>Reported by {{ problem.reported_by_detail?.display_name || problem.reported_by_detail?.username || problem.reported_by_employee_id || problem.reportedByEmployeeId || 'User' }}</span>
          <span v-if="problem.resolver_detail || problem.resolver_employee_id || problem.resolverEmployeeId">
            <i class="bi bi-person-check me-1"></i>Resolver: {{ problem.resolver_detail?.display_name || problem.resolver_detail?.username || problem.resolver_employee_id || problem.resolverEmployeeId }}
          </span>
          <span v-if="problem.resolved_at || problem.resolvedAt">
            <i class="bi bi-clock-check me-1"></i>Resolved {{ formatDateTime(problem.resolved_at || problem.resolvedAt) }}
          </span>
        </div>
        <div v-if="problem.resolution || problem.resolution_notes || problem.resolutionNotes" class="mt-2 p-2 rounded" style="background:var(--tf-surface-3);font-size:0.82rem">
          <i class="bi bi-check2-circle text-success me-1"></i>{{ problem.resolution || problem.resolution_notes || problem.resolutionNotes }}
        </div>
      </div>
      <RouterLink v-if="showLink" :to="`/problems/${problem.id}`" class="btn btn-sm btn-tf-ghost flex-shrink-0">
        <i class="bi bi-arrow-right"></i>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import TaskStatus from './TaskStatus.vue'
import { formatDateTime } from '@/utils/formatters'

defineProps({
  problem:  { type: Object, required: true },
  showLink: { type: Boolean, default: true },
})
</script>
