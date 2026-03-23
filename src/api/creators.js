import apiClient from './client'

export const creatorsAPI = {
  getCreators: async (params = {}) => {
    const response = await apiClient.get('/creators/', { params })
    return response.data
  },

  getCategories: async () => {
    const response = await apiClient.get('/creators/categories')
    return response.data
  },

  getCreator: async (creatorId) => {
    const response = await apiClient.get(`/creators/${creatorId}`)
    return response.data
  },

  getCreatorReviews: async (creatorId, params = {}) => {
    const response = await apiClient.get(`/creators/${creatorId}/reviews`, { params })
    return response.data
  },

  getCreatorContent: async (creatorId) => {
    const response = await apiClient.get(`/creators/${creatorId}/content`)
    return response.data
  },
}