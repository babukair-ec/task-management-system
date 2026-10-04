import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('tf_token') || localStorage.getItem('access_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('tf_user') || localStorage.getItem('user_data') || 'null'))
  const employee = ref(JSON.parse(localStorage.getItem('tf_employee') || localStorage.getItem('employee_data') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const currentEmployee = computed(() => employee.value || user.value)
  const currentUser = computed(() => user.value)

  function setAuth(newToken, newUser, newEmployee = null) {
    token.value = newToken
    user.value  = newUser
    employee.value = newEmployee || (newUser?.employee || newUser)

    localStorage.setItem('tf_token', newToken)
    localStorage.setItem('access_token', newToken)
    localStorage.setItem('tf_user', JSON.stringify(newUser))
    localStorage.setItem('user_data', JSON.stringify(newUser))

    if (employee.value) {
      localStorage.setItem('tf_employee', JSON.stringify(employee.value))
      localStorage.setItem('employee_data', JSON.stringify(employee.value))
    }
  }

  function clearAuth() {
    token.value = null
    user.value  = null
    employee.value = null
    localStorage.removeItem('tf_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('tf_user')
    localStorage.removeItem('user_data')
    localStorage.removeItem('tf_employee')
    localStorage.removeItem('employee_data')
  }

  return {
    token,
    user,
    employee,
    isAuthenticated,
    currentEmployee,
    currentUser,
    setAuth,
    clearAuth,
  }
})

// Alias export for backward compatibility
export const useAuth = useAuthStore
