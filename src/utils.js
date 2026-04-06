// utils.js — shared helper functions

/**
 * Format a YYYY-MM-DD date string to a readable label like "Jan 15, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  // Parse as local date to avoid UTC offset shifting the day
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Return how many days until a date string (negative = past due)
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

/**
 * Today's date as YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().split('T')[0]
}
