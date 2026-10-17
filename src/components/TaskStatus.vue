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
  DRAFT:          { icon: 'bi bi-pencil',              defaultLabel: 'Draft'          },
  AVAILABLE:      { icon: 'bi bi-broadcast',           defaultLabel: 'Available'      },
  ASSIGNED:       { icon: 'bi bi-person-check',        defaultLabel: 'Assigned'       },
  IN_PROGRESS:    { icon: 'bi bi-play-circle',         defaultLabel: 'In Progress'    },
  BLOCKED:        { icon: 'bi bi-exclamation-octagon', defaultLabel: 'Blocked'        },
  SUBMITTED:      { icon: 'bi bi-send',                defaultLabel: 'Submitted'      },
  PENDING_REVIEW: { icon: 'bi bi-eyeglasses',          defaultLabel: 'Pending Review' },
  APPROVED:       { icon: 'bi bi-check2-all',          defaultLabel: 'Approved'       },
  TESTING:        { icon: 'bi bi-bug',                 defaultLabel: 'Testing'        },
  TEST_FAILED:    { icon: 'bi bi-exclamation-triangle',defaultLabel: 'Test Failed'    },
  PASSED:         { icon: 'bi bi-shield-check',        defaultLabel: 'Passed'         },
  CLOSED:         { icon: 'bi bi-check-circle-fill',   defaultLabel: 'Closed'         },
  COMPLETED:      { icon: 'bi bi-check-circle',        defaultLabel: 'Completed'      },
  CANCELLED:      { icon: 'bi bi-x-circle',            defaultLabel: 'Cancelled'      },
  // Problem statuses
  OPEN:           { icon: 'bi bi-exclamation-circle',  defaultLabel: 'Open'           },
  RESOLVED:       { icon: 'bi bi-check2-circle',       defaultLabel: 'Resolved'       },
  // Request / Supervision statuses
  PENDING:        { icon: 'bi bi-clock',               defaultLabel: 'Pending'        },
  ACCEPTED:       { icon: 'bi bi-check-circle',        defaultLabel: 'Accepted'       },
  REJECTED:       { icon: 'bi bi-x-circle',            defaultLabel: 'Rejected'       },
  ESCALATED:      { icon: 'bi bi-arrow-up-circle',     defaultLabel: 'Escalated'      },
}

const meta        = computed(() => META[props.status] || { icon: 'bi bi-circle', defaultLabel: props.status })
const icon        = computed(() => meta.value.icon)
const label       = computed(() => t(`status.${props.status}`, meta.value.defaultLabel))
const statusClass = computed(() => `status-${(props.status || '').toLowerCase().replace(/_/g, '-')}`)
</script>
