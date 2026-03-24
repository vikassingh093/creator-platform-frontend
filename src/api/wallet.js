import apiClient from './client'

export const walletAPI = {
  // ── KEPT: existing ───────────────────────────────────
  getWallet: async () => {
    const response = await apiClient.get('/wallet/')
    return response.data
  },

  getTransactions: async () => {
    const response = await apiClient.get('/wallet/transactions')
    return response.data
  },

  // ── NEW: Razorpay ────────────────────────────────────
  createOrder: async (amount) => {
    const response = await apiClient.post('/wallet/create-order', { amount })
    return response.data
  },

  verifyPayment: async (data) => {
    const response = await apiClient.post('/wallet/verify-payment', data)
    return response.data
  },
}