import apiClient from './client'
import { useAuthStore } from '@/stores/auth'

export const employeesApi = {
  list: () =>
    apiClient.get('/employees/'),

  get: (id) =>
    apiClient.get(`/employees/${id}/`),

  create: (employeeData) =>
    apiClient.post('/employees/', employeeData),

  getMe: () =>
    apiClient.get('/employees/me/'),

  updateMe: (data) =>
    apiClient.patch('/employees/me/', data),

  eligibleManagers: () =>
    apiClient.get('/employees/eligible-managers/'),

  // Hierarchy
  hierarchy: () =>
    apiClient.get('/employees/hierarchy/'),

  // Supervision Requests
  listSupervisionRequests: (params = {}) =>
    apiClient.get('/employees/supervision-requests/', { params }),

  createSupervisionRequest: (data) =>
    apiClient.post('/employees/supervision-requests/', data),

  approveSupervisionRequest: (id) =>
    apiClient.post(`/employees/supervision-requests/${id}/approve/`),

  rejectSupervisionRequest: (id, data = {}) =>
    apiClient.post(`/employees/supervision-requests/${id}/reject/`, data),

  escalateSupervisionRequest: (id) =>
    apiClient.post(`/employees/supervision-requests/${id}/escalate/`),

  cancelSupervisionRequest: (id) =>
    apiClient.post(`/employees/supervision-requests/${id}/cancel/`),

  // Departments & Projects
  listDepartmentsProjects: () =>
    apiClient.get('/employees/departments-projects/'),

  getDepartmentProject: (id) =>
    apiClient.get(`/employees/departments-projects/${id}/`),

  createDepartmentProject: (data) =>
    apiClient.post('/employees/departments-projects/', data),

  updateDepartmentProject: (id, data) =>
    apiClient.patch(`/employees/departments-projects/${id}/`, data),

  // Assignments
  listAssignments: (params = {}) =>
    apiClient.get('/employees/assignments/', { params }),

  checkAssignmentPermission: (departmentProjectId) =>
    apiClient.get('/employees/assignments/check-permission/', {
      params: { department_project: departmentProjectId }
    }),

  createAssignment: (data) =>
    apiClient.post('/employees/assignments/', data),

  deleteAssignment: (id) =>
    apiClient.delete(`/employees/assignments/${id}/`),

  dashboard: async () => {
    const auth = useAuthStore()
    const employeeId = auth.employee?.outer_id || auth.employee?.id || auth.user?.outer_id || auth.user?.id

    try {
      const [tasksRes, availRes, reqsRes] = await Promise.all([
        apiClient.get('/tasks/', { params: { owner_id: employeeId } }).catch(() => ({ data: [] })),
        apiClient.get('/tasks/', { params: { available_for_me: 'true' } }).catch(() => ({ data: [] })),
        apiClient.get('/task-requests/', { params: { type: 'received' } }).catch(() => ({ data: [] })),
      ])

      const tasks = tasksRes.data || []
      const activeTasks = tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'TESTING', 'PENDING_REVIEW'].includes(t.status))

      return {
        active_tasks_count: activeTasks.length,
        available_tasks_count: (availRes.data || []).length,
        pending_requests_count: (reqsRes.data || []).filter(r => r.status === 'PENDING').length,
        blocking_problems_count: tasks.filter(t => t.status === 'BLOCKED').length,
        active_tasks: activeTasks.slice(0, 5),
      }
    } catch {
      return {
        active_tasks_count: 0,
        available_tasks_count: 0,
        pending_requests_count: 0,
        blocking_problems_count: 0,
        active_tasks: [],
      }
    }
  },
}
