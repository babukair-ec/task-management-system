<template>
  <div>
    <div class="page-header">
      <h1 class="page-title"><i class="bi bi-people me-2"></i>Employees</h1>
      <p class="page-subtitle">Team members in the system</p>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border text-primary" style="width:1.5rem;height:1.5rem"></div>
    </div>

    <div v-else class="row g-3">
      <div v-for="emp in employees" :key="emp.id" class="col-12 col-sm-6 col-lg-4">
        <div class="tf-card d-flex align-items-center gap-3">
          <div class="avatar" style="width:44px;height:44px;font-size:1rem;flex-shrink:0">{{ initials(emp) }}</div>
          <div class="flex-grow-1 min-w-0">
            <div class="fw-semibold text-truncate">{{ emp.display_name || emp.username }}</div>
            <div class="text-muted" style="font-size:0.78rem">@{{ emp.username }}</div>
            <div v-if="emp.department" class="text-muted" style="font-size:0.72rem">{{ emp.department }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { employeesApi } from '@/api/employees'
import { initials } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

const toast     = useToast()
const employees = ref([])
const loading   = ref(true)

onMounted(async () => {
  try {
    const { data } = await employeesApi.list()
    employees.value = data
  } catch { toast.error('Failed to load employees') }
  finally { loading.value = false }
})
</script>
