import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = (userData, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try {
      // ✅ End any active call before logging out — no charge
      const activeRoomId = localStorage.getItem("active_room_id")
      if (activeRoomId) {
        await apiClient.post("/calls/end", {
          room_id: parseInt(activeRoomId),
          duration: 0
        }).catch(() => {})
        localStorage.removeItem("active_room_id")
      }
    } catch (e) {}

    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("active_room_id")
    setUser(null)
    navigate("/login", { replace: true })
  }

  // ✅ Sync user state if token removed externally (e.g. another tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        setUser(null)
        navigate("/login", { replace: true })
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}