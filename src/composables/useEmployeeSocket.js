import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { t } from '@/i18n'

const isConnected = ref(false)
const lastEvent = ref(null)
const lastEmployee = ref(null)
const listeners = new Set()

let socket = null
let reconnectTimer = null
let pingTimer = null
let isConnecting = false

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Use Vite proxy endpoint by default, with direct port fallback
  return `${protocol}//${window.location.host}/ws/employees`
}

function handleMessage(event) {
  try {
    const payload = JSON.parse(event.data)
    lastEvent.value = payload

    const eventType = payload.event || payload.type
    const employeeData = payload.data || payload.employee

    if ((eventType === 'employee.created' || eventType === 'employee.updated') && employeeData) {
      lastEmployee.value = employeeData
      const auth = useAuthStore()
      const toast = useToast()

      const currentUsername = auth.user?.username
      const currentUserOuterId = auth.user?.outer_id || auth.user?.id || auth.user?.user_id

      const matchesUser =
        (currentUsername && employeeData.username === currentUsername) ||
        (currentUserOuterId && (employeeData.user_id === currentUserOuterId || employeeData.outer_id === currentUserOuterId)) ||
        (!auth.employee && currentUsername && employeeData.username === currentUsername)

      if (matchesUser || !auth.employee) {
        auth.setEmployee(employeeData)
        if (eventType === 'employee.created') {
          toast.success(
            t('profile.realtime_created') || `Employee profile for ${employeeData.username} ready!`
          )
        }
      }

      // Notify all registered component listeners
      listeners.forEach((listener) => {
        try {
          listener(employeeData, eventType)
        } catch (err) {
          console.error('[EmployeeWS] Listener error:', err)
        }
      })
    }
  } catch (err) {
    console.debug('[EmployeeWS] Error parsing message:', err)
  }
}

function startPing() {
  stopPing()
  pingTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 25000)
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
  }
}

export function initEmployeeSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  if (isConnecting) return
  isConnecting = true

  const primaryUrl = getWebSocketUrl()
  const fallbackUrl = 'ws://localhost:8003'

  function tryConnect(url, isFallback = false) {
    try {
      socket = new WebSocket(url)

      socket.onopen = () => {
        isConnected.value = true
        isConnecting = false
        startPing()

        // Send subscribe message with current user id if logged in
        const auth = useAuthStore()
        const uid = auth.user?.outer_id || auth.user?.id
        if (uid) {
          socket.send(JSON.stringify({ type: 'subscribe', user_id: uid }))
        }
      }

      socket.onmessage = handleMessage

      socket.onerror = (err) => {
        console.warn(`[EmployeeWS] Connection error on ${url}:`, err)
        if (!isFallback && !isConnected.value) {
          // Attempt fallback directly to WebSocket server port 8003
          socket.close()
          tryConnect(fallbackUrl, true)
        }
      }

      socket.onclose = () => {
        isConnected.value = false
        isConnecting = false
        stopPing()
        scheduleReconnect()
      }
    } catch (e) {
      isConnecting = false
      if (!isFallback) {
        tryConnect(fallbackUrl, true)
      } else {
        scheduleReconnect()
      }
    }
  }

  tryConnect(primaryUrl, false)
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initEmployeeSocket()
  }, 4000)
}

export function useEmployeeSocket() {
  initEmployeeSocket()

  function onEmployeeEvent(callback) {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  return {
    isConnected,
    lastEvent,
    lastEmployee,
    onEmployeeEvent,
  }
}
