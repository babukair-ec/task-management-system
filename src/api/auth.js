import apiClient from './client'

export const authApi = {
  // Request 1: Authenticate with User Service to get token and user info
  getTokenAndUser: (username, password) =>
    apiClient.post('/auth/token/', { username, password }),

  // Request 2: Fetch employee profile with Bearer token from Employee Service
  getEmployeeProfile: (token) =>
    apiClient.get('/employees/me/', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Two-step login workflow
  login: async (username, password) => {
    // 1. Request One: Token and User Data from User Management Service (/api/auth/token/)
    const tokenResponse = await apiClient.post('/auth/token/', { username, password })
    const data = tokenResponse.data
    const token = data.token || data.access
    const user = data.user || { username }

    // 2. Request Two: Employee Profile from Employee Service (/api/employees/me/)
    let employee = null
    try {
      const empResponse = await apiClient.get('/employees/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      employee = empResponse.data
    } catch (err) {
      console.warn('[authApi] Employee profile fetch on login returned:', err)
      employee = user
    }

    return {
      ...tokenResponse,
      data: {
        ...data,
        token,
        access: token,
        expires_in: data.expires_in || 28800,
        user,
        employee,
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
