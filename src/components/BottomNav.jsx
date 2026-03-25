import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { notificationsAPI } from '../api/notifications'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getNotifications()
      setUnreadCount(data.unread_count || 0)
    } catch (err) {}
  }

  const tabs = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/search', icon: '🔍', label: 'Search' },
    { path: '/notifications', icon: '🔔', label: 'Alerts', badge: unreadCount },
    { path: '/wallet', icon: '💰', label: 'Wallet' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#FFC629] px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 relative"
            >
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition ${
                isActive ? 'bg-[#FFC629]' : 'bg-transparent'
              }`}>
                <span className="text-xl">{tab.icon}</span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold transition ${
                isActive ? 'text-[#FFC629]' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}