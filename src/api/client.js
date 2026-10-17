import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token and current locale to every request
apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()

  // If token is expired, reject request before dispatch and redirect to login
  if (auth.token && auth.isExpired()) {
    auth.handleSessionExpired()
    return Promise.reject(new axios.Cancel('Session expired. Action blocked.'))
  }

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  const employeeOuterId = auth.currentEmployee?.outer_id || auth.employee?.outer_id
  if (employeeOuterId) {
    config.headers['X-Employee-Id'] = String(employeeOuterId)
  }
  const locale = localStorage.getItem('tf_locale') || localStorage.getItem('taskorbit_locale') || 'en'
  config.headers['Accept-Language'] = locale
  return config
})

// Handle 401 globally — terminate session and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.handleSessionExpired()
    }
    return Promise.reject(error)
  }
)

export default apiClient
