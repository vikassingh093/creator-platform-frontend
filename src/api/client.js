import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

apiClient.interceptors.request.use((config) => {
  // ✅ FIXED: read from zustand persisted store correctly
  try {
    const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    const token = stored?.state?.access_token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.error('Token read error:', e)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient