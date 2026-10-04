<template>
  <div class="task-actions-bar">
    <!-- 1. Claim Task Button (when available and eligible) -->
    <button 
      v-if="canClaim" 
      class="btn btn-primary"
      :disabled="loading"
      @click="$emit('claim')"
    >
      <i class="bi bi-hand-index-thumb"></i> {{ $t('taskDetail.claimNow') }}
    </button>

    <!-- 2. Start Task Button (owner, ASSIGNED) -->
    <button 
      v-if="canStart" 
      class="btn btn-success"
      :disabled="loading"
      @click="$emit('start')"
    >
      <i class="bi bi-play-fill"></i> {{ $t('taskDetail.startWork') }}
    </button>

    <!-- 3. Report Problem Button (owner, IN_PROGRESS / BLOCKED) -->
    <button 
      v-if="canReportProblem" 
      class="btn btn-warning"
      :disabled="loading"
      @click="$emit('open-problem-modal')"
    >
      <i class="bi bi-exclamation-triangle"></i> {{ $t('taskDetail.reportProblem') }}
    </button>

    <!-- 4. Complete Task Button (owner, IN_PROGRESS and no active problems) -->
    <button 
      v-if="canComplete" 
      class="btn btn-success"
      :disabled="loading || hasActiveProblems"
      :title="hasActiveProblems ? $t('taskDetail.mustResolveProblems') : $t('taskDetail.completeTask')"
      @click="$emit('complete')"
    >
      <i class="bi bi-check2-circle"></i> {{ $t('taskDetail.completeTask') }}
    </button>

    <!-- 5. Reassign Task Button (owner or creator) -->
    <button 
      v-if="canReassign" 
      class="btn btn-secondary"
      :disabled="loading"
      @click="$emit('open-reassign-modal')"
    >
      <i class="bi bi-arrow-left-right"></i> {{ $t('taskDetail.reassign') }}
    </button>

    <!-- 6. Cancel Task Button (owner or creator) -->
    <button 
      v-if="canCancel" 
      class="btn btn-danger btn-sm"
      :disabled="loading"
      @click="$emit('cancel')"
    >
      <i class="bi bi-x-circle"></i> {{ $t('taskDetail.cancelTask') }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuth } from '../stores/auth';

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  'claim',
  'start',
  'complete',
  'cancel',
  'open-problem-modal',
  'open-reassign-modal'
]);

const { currentEmployee } = useAuth();

const myId = computed(() => currentEmployee.value?.id);

const isOwner = computed(() => {
  return props.task?.current_owner_id === myId.value;
});

const isCreator = computed(() => {
  return props.task?.creator_id === myId.value;
});

const canClaim = computed(() => {
  if (props.task?.status !== 'AVAILABLE' || props.task?.current_owner_id !== null) {
    return false;
  }
  // Check eligibility if whitelist exists
  if (props.task?.allowed_claimants && props.task.allowed_claimants.length > 0) {
    return props.task.allowed_claimants.some(c => c.employee_id === myId.value);
  }
  return true;
});

const canStart = computed(() => {
  return isOwner.value && props.task?.status === 'ASSIGNED';
});

const canReportProblem = computed(() => {
  return isOwner.value && ['IN_PROGRESS', 'BLOCKED'].includes(props.task?.status);
});

const hasActiveProblems = computed(() => {
  if (!props.task?.problems) return false;
  return props.task.problems.some(p => ['OPEN', 'IN_PROGRESS'].includes(p.status));
});

const canComplete = computed(() => {
  return isOwner.value && props.task?.status === 'IN_PROGRESS';
});

const canReassign = computed(() => {
  return (isOwner.value || isCreator.value) && !['COMPLETED', 'CANCELLED'].includes(props.task?.status);
});

const canCancel = computed(() => {
  return (isOwner.value || isCreator.value) && !['COMPLETED', 'CANCELLED'].includes(props.task?.status);
});
</script>

<style scoped>
.task-actions-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
</style>
