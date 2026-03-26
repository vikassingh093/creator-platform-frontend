import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

apiClient.interceptors.request.use((config) => {
  // ✅ Read token from zustand persisted store
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

// ✅ Auto-refresh on 401 instead of forcing login
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

const forceLogout = () => {
  localStorage.clear()
  window.location.href = '/login'
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Not a 401 — just reject
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Already retried — force logout
    if (originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }

    // If already refreshing — queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // ✅ Get refresh token from zustand store
      const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const refreshToken = stored?.state?.refresh_token

      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      // ✅ Call /refresh endpoint
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )

      const newAccessToken = res.data.access_token

      // ✅ Update zustand persisted store with new token
      stored.state.access_token = newAccessToken
      localStorage.setItem('auth-storage', JSON.stringify(stored))

      // ✅ Retry all queued requests
      processQueue(null, newAccessToken)

      // ✅ Retry original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)

    } catch (refreshError) {
      // Refresh token also expired — force login
      processQueue(refreshError, null)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient