import apiClient from './client'

export const walletAPI = {
  getWallet: async () => {
    const response = await apiClient.get('/wallet/')
    return response.data
  },

  getTransactions: async () => {
    const response = await apiClient.get('/wallet/transactions')
    return response.data
  },

  addMoney: async (amount, paymentId) => {
    const response = await apiClient.post('/wallet/add-money', {
      amount,
      payment_id: paymentId,
    })
    return response.data
  },
}