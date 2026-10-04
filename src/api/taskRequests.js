import apiClient from './client'

export const taskRequestsApi = {
  list: () =>
    apiClient.get('/task-requests/'),

  received: (p = {}) =>
    apiClient.get('/task-requests/', { params: { type: 'received', ...p } }),

  sent: (p = {}) =>
    apiClient.get('/task-requests/', { params: { type: 'sent', ...p } }),

  create: (data) =>
    apiClient.post('/task-requests/', data),

  accept: (id) =>
    apiClient.post(`/task-requests/${id}/accept/`),

  reject: (id) =>
    apiClient.post(`/task-requests/${id}/reject/`),

  cancel: (id) =>
    apiClient.post(`/task-requests/${id}/cancel/`),
}
