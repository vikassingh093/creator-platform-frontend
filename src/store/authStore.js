import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      setAuth: (user, access_token, refresh_token) => set({
        user,
        access_token,
        refresh_token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        access_token: null,
        refresh_token: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore