<template>
  <div>
    <div class="d-flex gap-2 flex-wrap align-items-center">
      <div class="position-relative flex-grow-1" style="max-width:340px">
        <input
          v-model="query"
          type="text"
          class="form-control tf-input"
          :placeholder="placeholder"
          @focus="open = true"
          @blur="delayClose"
        />
        <div
          v-if="open && filtered.length"
          class="position-absolute w-100 mt-1 rounded shadow"
          style="background:var(--tf-surface-3); border:1px solid var(--tf-border); z-index:200; max-height:200px; overflow-y:auto"
        >
          <button
            v-for="emp in filtered"
            :key="emp.id"
            type="button"
            class="d-flex align-items-center gap-2 w-100 px-3 py-2 border-0 text-start"
            style="background:transparent; color:var(--tf-text); font-size:0.875rem; cursor:pointer"
            @mousedown.prevent="selectEmployee(emp)"
          >
            <div class="avatar" style="width:24px;height:24px;font-size:0.6rem">{{ initials(emp) }}</div>
            <div>
              <div class="fw-semibold">{{ emp.display_name || emp.full_name || emp.username }}</div>
              <div class="text-muted" style="font-size:0.72rem">{{ emp.department || emp.job_title || emp.username }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Selected employees (multi-select mode) -->
    <div v-if="multiple && selected.length" class="d-flex flex-wrap gap-2 mt-2">
      <span
        v-for="emp in selected"
        :key="emp.id"
        class="d-inline-flex align-items-center gap-1 px-2 py-1 rounded"
        style="background:var(--tf-primary-glow); border:1px solid var(--tf-primary); font-size:0.78rem"
      >
        {{ emp.display_name || emp.full_name || emp.username }}
        <button type="button" class="border-0 p-0 ms-1" style="background:transparent;color:var(--tf-text-muted);line-height:1" @click="remove(emp)">
          <i class="bi bi-x"></i>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { employeesApi } from '@/api/employees'
import { initials } from '@/utils/formatters'

const props = defineProps({
  modelValue: { type: [Array, Number, null], default: null },
  multiple:   { type: Boolean, default: false },
  placeholder:{ type: String, default: 'Search employees…' },
  excludeIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const allEmployees = ref([])
const query   = ref('')
const open    = ref(false)
const selected = ref([])  // for multiple mode

onMounted(async () => {
  try {
    const { data } = await employeesApi.list()
    allEmployees.value = data || []
    if (props.modelValue) {
      if (props.multiple && Array.isArray(props.modelValue)) {
        selected.value = allEmployees.value.filter(e => props.modelValue.includes(e.id))
      } else {
        const found = allEmployees.value.find(e => e.id === props.modelValue)
        if (found) {
          query.value = found.display_name || found.full_name || found.username
        }
      }
    }
  } catch {}
})

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  return allEmployees.value.filter(e =>
    !props.excludeIds.includes(e.id) &&
    (e.username?.toLowerCase().includes(q) ||
     (e.display_name || e.full_name || '').toLowerCase().includes(q))
  )
})

function selectEmployee(emp) {
  if (props.multiple) {
    if (!selected.value.find(s => s.id === emp.id)) {
      selected.value.push(emp)
      emit('update:modelValue', selected.value.map(e => e.id))
    }
    query.value = ''
  } else {
    query.value = emp.display_name || emp.full_name || emp.username
    emit('update:modelValue', emp.id)
    open.value = false
  }
}

function remove(emp) {
  selected.value = selected.value.filter(e => e.id !== emp.id)
  emit('update:modelValue', selected.value.map(e => e.id))
}

function delayClose() {
  setTimeout(() => { open.value = false }, 150)
}
</script>
