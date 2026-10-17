import apiClient from './client'

export const tasksApi = {
  list: (params = {}) =>
    apiClient.get('/tasks/', { params }),

  available: () =>
    apiClient.get('/tasks/', { params: { available_for_me: 'true' } }),

  get: (id) =>
    apiClient.get(`/tasks/${id}/`),

  create: (data) => {
    // Normalize field names for Task Service
    const payload = {
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'MEDIUM',
      assignment_mode: data.assignment_mode || 'SELF',
      due_date: data.due_date || null,
      direct_assignee_id: data.direct_assignee_id || data.assignee_id || null,
      allowed_claimant_ids: data.allowed_claimant_ids || data.eligible_employee_ids || [],
      requested_employee_id: data.requested_employee_id || data.request_employee_id || null,
      project_id: data.project_id || null,
      problem_id: data.problem_id || null,
    }
    return apiClient.post('/tasks/', payload)
  },

  claim: (id) =>
    apiClient.post(`/tasks/${id}/claim/`),

  start: (id) =>
    apiClient.post(`/tasks/${id}/start/`),

  submitForReview: (id) =>
    apiClient.post(`/tasks/${id}/submit-for-review/`),

  review: (id, data) =>
    apiClient.post(`/tasks/${id}/review/`, data),

  testingQueue: () =>
    apiClient.get('/tasks/testing-queue/'),

  startTest: (id) =>
    apiClient.post(`/tasks/${id}/start-test/`),

  completeTest: (id, data) =>
    apiClient.post(`/tasks/${id}/complete-test/`, data),

  complete: (id) =>
    apiClient.post(`/tasks/${id}/complete/`),

  cancel: (id) =>
    apiClient.post(`/tasks/${id}/cancel/`),

  reassign: (id, data) =>
    apiClient.post(`/tasks/${id}/reassign/`, {
      new_owner_id: data.new_owner_id || data.newOwnerId,
      reason: data.reason || '',
    }),

  history: async (id) => {
    try {
      const res = await apiClient.get(`/tasks/${id}/`)
      return { data: res.data?.history || [] }
    } catch {
      return { data: [] }
    }
  },

  // Problems linked with tasks
  getProblems: (id) =>
    apiClient.get('/problems/', { params: { task_id: id } }),

  reportProblem: (id, d) =>
    apiClient.post('/problems/', {
      task_id: id,
      description: d.description || d,
    }),

  createProblemResolutionTask: (problemId, data = {}) =>
    apiClient.post(`/problems/${problemId}/create-resolution-task/`, data),
}
