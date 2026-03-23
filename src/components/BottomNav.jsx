import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '🔍', label: 'Search', path: '/search' },
    { icon: '💬', label: 'Chats', path: '/chats' },
    { icon: '💰', label: 'Wallet', path: '/wallet' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
            location.pathname === tab.path
              ? 'text-purple-600'
              : 'text-gray-400 hover:text-purple-600'
          }`}
        >
          <span className="text-2xl">{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}