import apiClient from './client'

export const problemsApi = {
  get: (id) =>
    apiClient.get(`/problems/${id}/`),

  list: (params) =>
    apiClient.get('/problems/', { params }),

  create: (data) =>
    apiClient.post('/problems/', data),

  createResolutionTask: (id, data) =>
    apiClient.post(`/problems/${id}/create-resolution-task/`, data),

  assignResolver: (id, d) =>
    apiClient.post(`/problems/${id}/assign-resolver/`, {
      resolverId: d.resolverId || d.resolver_id,
    }),

  start: (id) =>
    apiClient.post(`/problems/${id}/start/`),

  resolve: (id, d) =>
    apiClient.post(`/problems/${id}/resolve/`, {
      resolutionNotes: d.resolution || d.resolutionNotes || d.resolution_notes || '',
    }),

  cancel: (id) =>
    apiClient.post(`/problems/${id}/cancel/`),
}
