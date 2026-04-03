const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  .replace('/api/v1', '')
  .replace('/api', '')

export function getPhotoUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}