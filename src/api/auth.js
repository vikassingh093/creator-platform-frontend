import apiClient from './client'

export const authAPI = {
  // Send OTP
  sendOTP: async (phone) => {
    const response = await apiClient.post('/auth/send-otp', { phone })
    return response.data
  },

  // Verify OTP
  verifyOTP: async (phone, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { phone, otp })
    return response.data
  },

  // Logout
  logout: async (user_id) => {
    const response = await apiClient.post('/auth/logout', { user_id })
    return response.data
  },
}