import apiClient from './client'
import { useAuthStore } from '@/stores/auth'

export const employeesApi = {
  list: () =>
    apiClient.get('/employees/'),

  get: (id) =>
    apiClient.get(`/employees/${id}/`),

  dashboard: async () => {
    const auth = useAuthStore()
    const employeeId = auth.employee?.id || auth.user?.id

    try {
      const [tasksRes, availRes, reqsRes] = await Promise.all([
        apiClient.get('/tasks/', { params: { owner_id: employeeId } }).catch(() => ({ data: [] })),
        apiClient.get('/tasks/', { params: { available_for_me: 'true' } }).catch(() => ({ data: [] })),
        apiClient.get('/task-requests/', { params: { type: 'received' } }).catch(() => ({ data: [] })),
      ])

      const allMyTasks = tasksRes.data || []
      const available = availRes.data || []
      const requests = reqsRes.data || []

      const my_active_tasks = allMyTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status))
      const my_blocked_tasks = allMyTasks.filter(t => t.status === 'BLOCKED')
      const recently_completed = allMyTasks.filter(t => t.status === 'COMPLETED')
      const pending_requests = requests.filter(r => r.status === 'PENDING')

      return {
        data: {
          my_active_tasks,
          my_blocked_tasks,
          available_tasks: available,
          pending_requests,
          recently_completed,
        }
      }
    } catch (err) {
      return {
        data: {
          my_active_tasks: [],
          my_blocked_tasks: [],
          available_tasks: [],
          pending_requests: [],
          recently_completed: [],
        }
      }
    }
  },
}
