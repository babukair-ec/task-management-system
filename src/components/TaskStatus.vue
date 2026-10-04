<template>
  <span :class="['status-badge', statusClass]">
    <i :class="icon"></i>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const props = defineProps({
  status: { type: String, required: true },
})

const { t } = useI18n()

const META = {
  DRAFT:       { icon: 'bi bi-pencil',              defaultLabel: 'Draft'       },
  AVAILABLE:   { icon: 'bi bi-broadcast',           defaultLabel: 'Available'   },
  ASSIGNED:    { icon: 'bi bi-person-check',        defaultLabel: 'Assigned'    },
  IN_PROGRESS: { icon: 'bi bi-play-circle',         defaultLabel: 'In Progress' },
  BLOCKED:     { icon: 'bi bi-exclamation-octagon', defaultLabel: 'Blocked'     },
  COMPLETED:   { icon: 'bi bi-check-circle',        defaultLabel: 'Completed'   },
  CANCELLED:   { icon: 'bi bi-x-circle',            defaultLabel: 'Cancelled'   },
  // Problem statuses
  OPEN:        { icon: 'bi bi-exclamation-circle',  defaultLabel: 'Open'        },
  RESOLVED:    { icon: 'bi bi-check2-circle',       defaultLabel: 'Resolved'    },
  // Request statuses
  PENDING:     { icon: 'bi bi-clock',               defaultLabel: 'Pending'     },
  ACCEPTED:    { icon: 'bi bi-check-circle',        defaultLabel: 'Accepted'    },
  REJECTED:    { icon: 'bi bi-x-circle',            defaultLabel: 'Rejected'    },
}

const meta        = computed(() => META[props.status] || { icon: 'bi bi-circle', defaultLabel: props.status })
const icon        = computed(() => meta.value.icon)
const label       = computed(() => t(`status.${props.status}`, meta.value.defaultLabel))
const statusClass = computed(() => `status-${(props.status || '').toLowerCase()}`)
</script>
