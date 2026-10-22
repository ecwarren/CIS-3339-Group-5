// Shared helpers (previously copy-pasted into several views)

// Formats an ISO date as MM/DD/YYYY (UTC, so dates don't shift a day)
export function formatDate(date) {
  if (!date) return ''
  const isoDate = new Date(date)
  const year = isoDate.getUTCFullYear()
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(isoDate.getUTCDate()).padStart(2, '0')
  return `${month}/${day}/${year}`
}

// Turns an API success response (string, { message }, or a record) into toast text
export function toMessage(value, fallback = 'Success') {
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (value.message) return value.message
  return fallback
}