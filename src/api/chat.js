import apiClient from './client'

export const chatAPI = {
  startChat: async (creatorId) => {
    const response = await apiClient.post(`/chat/start/${creatorId}`)
    return response.data
  },

  getMessages: async (roomId) => {
    const response = await apiClient.get(`/chat/room/${roomId}/messages`)
    return response.data
  },

  endChat: async (roomId) => {
    const response = await apiClient.post(`/chat/room/${roomId}/end`)
    return response.data
  },

  getCreatorById: async (creatorId) => {
    const response = await apiClient.get(`/creators/${creatorId}`)
    return response.data
  },

  getCreator: async (creatorId) => {
    const response = await apiClient.get(`/creators/${creatorId}`)
    return response.data
  },
}