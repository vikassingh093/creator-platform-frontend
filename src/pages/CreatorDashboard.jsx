import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'
import BottomNav from '../components/BottomNav'

export default function CreatorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeRooms, setActiveRooms] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    fetchDashboard()
    fetchActiveChats()
    // Poll every 5 seconds for new chats
    const interval = setInterval(fetchActiveChats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/creators/dashboard')
      setStats(res.data.stats)
      setIsOnline(res.data.is_online)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveChats = async () => {
    try {
      const res = await apiClient.get('/chat/creator/active-rooms')
      console.log('Active rooms:', res.data) // check browser console
      setActiveRooms(res.data.rooms || [])
    } catch (err) {
      console.error('Active rooms error:', err.response?.data || err)
    }
  }

  const toggleOnline = async () => {
    try {
      await apiClient.post('/creators/toggle-online')
      setIsOnline(prev => !prev)
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-16 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            <p className="text-pink-200 text-sm mt-1">Welcome, {user?.name}!</p>
          </div>
          {/* Online Toggle */}
          <button
            onClick={toggleOnline}
            className={`px-4 py-2 rounded-full font-bold text-sm transition ${
              isOnline
                ? 'bg-green-500 text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {isOnline ? '🟢 Online' : '⚫ Offline'}
          </button>
        </div>
      </div>

      {/* Active Chats - Most Important */}
      <div className="mx-4 -mt-8 mb-4">
        <div className="bg-white rounded-3xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">
              🔴 Active Chats
              {activeRooms.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeRooms.length}
                </span>
              )}
            </h2>
            <button
              onClick={fetchActiveChats}
              className="text-xs text-pink-600 font-semibold"
            >
              Refresh
            </button>
          </div>

          {activeRooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-gray-400 text-sm">No active chats</p>
              <p className="text-gray-300 text-xs mt-1">
                {isOnline ? 'Waiting for customers...' : 'Go online to receive chats'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3"
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {room.user_photo ? (
                      <img src={room.user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      room.user_name?.charAt(0)
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{room.user_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(room.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/chat/${user.id}?roomId=${room.id}`)}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Open 💬
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-pink-600">₹{stats?.today_earnings || '0'}</p>
          <p className="text-gray-400 text-xs mt-1">Today's Earnings</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">{stats?.total_chats || '0'}</p>
          <p className="text-gray-400 text-xs mt-1">Total Chats</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">₹{stats?.total_earnings || '0'}</p>
          <p className="text-gray-400 text-xs mt-1">Total Earnings</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-yellow-500">{stats?.rating || '0.0'} ⭐</p>
          <p className="text-gray-400 text-xs mt-1">Rating</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}