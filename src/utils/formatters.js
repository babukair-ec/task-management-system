/**
 * Utility formatters used across the application.
 */

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function initials(user) {
  if (!user) return '?'
  if (typeof user === 'string') {
    return user.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  if (user.display_name) {
    return user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  if (user.full_name) {
    return user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  if (user.first_name || user.last_name) {
    return `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()
  }
  return (user.username || '?').slice(0, 2).toUpperCase()
}

export const getInitials = initials

export function displayName(user) {
  if (!user) return 'Unassigned'
  return user.display_name || user.full_name || user.get_full_name ||
    (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username)
}

export function statusClass(status) {
  return `status-${(status || '').toLowerCase().replace('_', '_')}`
}

export function priorityClass(priority) {
  return `priority-${(priority || '').toLowerCase()}`
}
