import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { t } from '@/i18n'
import { useToastStore } from '@/composables/useToast'

/**
 * Parses a JWT payload safely
 */
export function parseJwt(jwtToken) {
  if (!jwtToken || typeof jwtToken !== 'string') return null
  try {
    const parts = jwtToken.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) {
      base64 += '='
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Checks whether a token has expired
 */
export function isTokenExpired(jwtToken) {
  if (!jwtToken) return true
  const payload = parseJwt(jwtToken)
  if (payload && typeof payload.exp === 'number') {
    // JWT exp is in epoch seconds, Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000
  }
  const storedExp = localStorage.getItem('tf_token_exp')
  if (storedExp) {
    const expNum = parseInt(storedExp, 10)
    if (!isNaN(expNum)) {
      return Date.now() >= expNum
    }
  }
  return false
}

/**
 * Calculates remaining lifespan of token in milliseconds
 */
export function getTokenRemainingMs(jwtToken) {
  if (!jwtToken) return 0
  const payload = parseJwt(jwtToken)
  if (payload && typeof payload.exp === 'number') {
    const ms = payload.exp * 1000 - Date.now()
    return ms > 0 ? ms : 0
  }
  const storedExp = localStorage.getItem('tf_token_exp')
  if (storedExp) {
    const expNum = parseInt(storedExp, 10)
    if (!isNaN(expNum)) {
      const ms = expNum - Date.now()
      return ms > 0 ? ms : 0
    }
  }
  return 0
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('tf_token') || localStorage.getItem('access_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('tf_user') || localStorage.getItem('user_data') || 'null'))
  const employee = ref(JSON.parse(localStorage.getItem('tf_employee') || 'null'))
  const sessionExpired = ref(false)

  // Returns true ONLY if token exists AND is NOT expired
  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))
  const currentEmployee = computed(() => employee.value)
  const hasEmployeeProfile = computed(() => !!employee.value && !!(employee.value.id || employee.value.outer_id))

  let expirationTimer = null
  let isRelocating = false

  function clearExpirationTimer() {
    if (expirationTimer) {
      clearTimeout(expirationTimer)
      expirationTimer = null
    }
  }

  function scheduleExpirationTimer(jwtToken) {
    clearExpirationTimer()
    if (!jwtToken) return

    if (isTokenExpired(jwtToken)) {
      handleSessionExpired()
      return
    }

    const remainingMs = getTokenRemainingMs(jwtToken)
    // Cap at max 32-bit signed int for setTimeout (about 24.8 days)
    const timeoutDelay = Math.min(remainingMs, 2147483647)
    expirationTimer = setTimeout(() => {
      handleSessionExpired()
    }, timeoutDelay)
  }

  function isExpired() {
    return isTokenExpired(token.value)
  }

  function handleSessionExpired(notify = true) {
    if (isRelocating) return
    isRelocating = true

    clearAuth()
    sessionExpired.value = true

    if (notify) {
      try {
        const toast = useToastStore()
        toast.error(t('errors.ERR_TOKEN_EXPIRED') || 'Session expired. Please sign in again.')
      } catch {}
    }

    try {
      const currentPath = router?.currentRoute?.value?.fullPath || window.location.pathname
      const isLoginPage = router?.currentRoute?.value?.name === 'Login' || window.location.pathname === '/login'

      if (!isLoginPage) {
        router.replace({
          name: 'Login',
          query: {
            expired: 'true',
            redirect: currentPath && currentPath !== '/' && currentPath !== '/login' ? currentPath : undefined,
          },
        }).catch(() => {
          window.location.replace('/login?expired=true')
        })
      }
    } catch {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login?expired=true')
      }
    }

    setTimeout(() => {
      isRelocating = false
    }, 1500)
  }

  function checkExpiration() {
    if (token.value && isTokenExpired(token.value)) {
      handleSessionExpired()
    }
  }

  function setAuth(newToken, newUser, newEmployee = null, expiresInSeconds = null) {
    token.value = newToken
    user.value  = newUser
    employee.value = newEmployee || null
    sessionExpired.value = false

    localStorage.setItem('tf_token', newToken)
    localStorage.setItem('tf_user', JSON.stringify(newUser))
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')

    if (employee.value) {
      localStorage.setItem('tf_employee', JSON.stringify(employee.value))
      localStorage.removeItem('employee_data')
    } else {
      localStorage.removeItem('tf_employee')
      localStorage.removeItem('employee_data')
    }

    // Persist expiration timestamp (default 8 hours = 28800s)
    const payload = parseJwt(newToken)
    let expMs = null
    if (payload && typeof payload.exp === 'number') {
      expMs = payload.exp * 1000
    } else if (expiresInSeconds) {
      expMs = Date.now() + expiresInSeconds * 1000
    } else {
      expMs = Date.now() + 8 * 60 * 60 * 1000 // 8 hours
    }
    localStorage.setItem('tf_token_exp', expMs.toString())

    scheduleExpirationTimer(newToken)
  }

  function setEmployee(newEmployee) {
    employee.value = newEmployee || null
    if (employee.value) {
      localStorage.setItem('tf_employee', JSON.stringify(employee.value))
      localStorage.removeItem('employee_data')
    } else {
      localStorage.removeItem('tf_employee')
      localStorage.removeItem('employee_data')
    }
  }

  function clearAuth() {
    clearExpirationTimer()
    token.value = null
    user.value  = null
    employee.value = null
    localStorage.removeItem('tf_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('tf_user')
    localStorage.removeItem('user_data')
    localStorage.removeItem('tf_employee')
    localStorage.removeItem('employee_data')
    localStorage.removeItem('tf_token_exp')
  }

  async function logout() {
    clearAuth()
    sessionExpired.value = false
    try {
      if (router?.currentRoute?.value?.name !== 'Login') {
        await router.replace('/login')
      }
    } catch {
      window.location.replace('/login')
    }
  }

  // Check initial token on startup: if already expired, purge immediately
  const initialToken = localStorage.getItem('tf_token') || localStorage.getItem('access_token') || null
  if (initialToken && isTokenExpired(initialToken)) {
    clearAuth()
    sessionExpired.value = true
  } else if (initialToken) {
    scheduleExpirationTimer(initialToken)
  }

  // Periodic and event-driven background checks
  if (typeof window !== 'undefined') {
    // Check every 10 seconds in background
    setInterval(checkExpiration, 10000)

    // Check when user refocuses tab or device wakes up
    window.addEventListener('focus', checkExpiration)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkExpiration()
      }
    })

    // Sync logout/expiry across multiple open browser tabs
    window.addEventListener('storage', (event) => {
      if ((event.key === 'tf_token' || event.key === 'access_token') && !event.newValue) {
        if (token.value) {
          handleSessionExpired(false)
        }
      }
    })
  }

  return {
    token,
    user,
    employee,
    sessionExpired,
    isAuthenticated,
    hasEmployeeProfile,
    currentEmployee,
    setAuth,
    setEmployee,
    clearAuth,
    logout,
    isExpired,
    handleSessionExpired,
    checkExpiration,
  }
})
