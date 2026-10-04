import apiClient from './client'

export const authApi = {
  login: async (username, password) => {
    // Calls Django User Service (/api/auth/token/)
    const response = await apiClient.post('/auth/token/', { username, password })
    const data = response.data
    // Normalize token and user keys for compatibility
    return {
      ...response,
      data: {
        ...data,
        token: data.token || data.access,
        access: data.access || data.token,
        user: data.user || data.employee || { username },
        employee: data.employee || data.user,
      }
    }
  },

  register: (userData) =>
    apiClient.post('/auth/register/', userData),

  logout: async () => {
    try {
      return await apiClient.post('/auth/logout/')
    } catch {
      return { data: { success: true } }
    }
  },

  me: () =>
    apiClient.get('/auth/me/'),
}
