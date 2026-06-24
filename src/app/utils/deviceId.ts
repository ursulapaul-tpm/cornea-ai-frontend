// Generates and persists a stable anonymous device ID in localStorage.
// Used to tie saved blueprint history to a browser/device without requiring login.

const STORAGE_KEY = 'cornea_device_id'

function generateId(): string {
  // Simple UUID v4 generator — no external deps needed
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}