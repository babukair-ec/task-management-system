import apiClient from './client'
import { useAuthStore } from '@/stores/auth'

export const employeesApi = {
  getMe: () =>
    apiClient.get('/employees/me/'),

  createMe: (data) =>
    apiClient.post('/employees/me/', data),

  updateMe: (data) =>
    apiClient.patch('/employees/me/', data),

  dashboard: async () => {
    const auth = useAuthStore()
    const employeeId = auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id

    try {
      const tasksRes = await apiClient.get('/tasks/', { params: { owner_id: employeeId } }).catch(() => ({ data: [] }))
      const tasks = tasksRes.data || []

      const activeTasks = tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'TESTING', 'PENDING_REVIEW'].includes(t.status))
      const blockedTasks = tasks.filter(t => t.status === 'BLOCKED')
      const completedTasks = tasks.filter(t => ['COMPLETED', 'CLOSED', 'PASSED'].includes(t.status))
      const remainingTasks = tasks.filter(t => !['COMPLETED', 'CLOSED', 'PASSED', 'CANCELLED'].includes(t.status))

      return {
        remaining_tasks_count: remainingTasks.length,
        completed_tasks_count: completedTasks.length,
        my_active_tasks: activeTasks,
        my_blocked_tasks: blockedTasks,
        recently_completed: completedTasks.slice(0, 5),
      }
    } catch {
      return {
        remaining_tasks_count: 0,
        completed_tasks_count: 0,
        my_active_tasks: [],
        my_blocked_tasks: [],
        recently_completed: [],
      }
    }
  },
}
