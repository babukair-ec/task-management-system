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
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  const locale = localStorage.getItem('tf_locale') || localStorage.getItem('taskorbit_locale') || 'en'
  config.headers['Accept-Language'] = locale
  return config
})

// Handle 401 globally — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.clearAuth()
      if (window.location.pathname !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
