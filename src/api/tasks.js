import apiClient from './client'

export const tasksApi = {
  listTasks: (params = {}) =>
    apiClient.get('/tasks/', { params }),

  getTask: (id) =>
    apiClient.get(`/tasks/${id}`),

  createTask: (data) =>
    apiClient.post('/tasks/', data),

  updateTask: (id, data) =>
    apiClient.patch(`/tasks/${id}`, data),

  startTask: (id) =>
    apiClient.post(`/tasks/${id}/start`),

  completeTask: (id) =>
    apiClient.post(`/tasks/${id}/complete`),

  cancelTask: (id) =>
    apiClient.post(`/tasks/${id}/cancel`),
}

export default tasksApi
