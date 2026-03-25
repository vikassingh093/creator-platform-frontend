import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/auth'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'
import apiClient from '../api/client'   // ✅ ADD THIS

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState(user?.name || '')
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleSaveProfile = () => {
    alert('Profile updated successfully! ✅')
    setShowEditModal(false)
  }

  const handleLogout = async () => {
    try {
      // ✅ End any active call before logout — no charge
      const activeRoomId = localStorage.getItem("active_room_id")
      if (activeRoomId) {
        await apiClient.post("/calls/end", {
          room_id: parseInt(activeRoomId),
          duration: 0
        }).catch(() => {})
        localStorage.removeItem("active_room_id")
      }
    } catch (e) {}

    try {
      await authAPI.logout(user?.id)
    } catch (err) {
      // ignore
    } finally {
      logout()
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("active_room_id")
      navigate('/login', { replace: true })
    }
  }

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: '👤', label: 'Edit Profile', action: () => setShowEditModal(true) },
        { icon: '📋', label: 'Transaction History', action: () => navigate('/transactions') },
        { icon: '🔔', label: 'Notifications', action: () => alert('Notifications Settings') },
        { icon: '🔒', label: 'Privacy & Security', action: () => alert('Privacy Settings') },
        { icon: '💳', label: 'Payment Methods', action: () => navigate('/wallet') },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: '❓', label: 'Help & FAQ', action: () => alert('Help Center') },
        { icon: '📞', label: 'Contact Support', action: () => alert('Contact Support') },
        { icon: '⭐', label: 'Rate the App', action: () => alert('Rate App') },
        { icon: '📋', label: 'Terms & Conditions', action: () => alert('Terms') },
      ]
    },
    {
      section: 'More',
      items: [
        { icon: '🌙', label: 'Dark Mode', action: () => alert('Coming Soon!') },
        { icon: '🌐', label: 'Language', action: () => alert('Coming Soon!') },
        { icon: '🗑️', label: 'Delete Account', action: () => alert('Are you sure?'), danger: true },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 pt-10 pb-16 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Profile 👤</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-white bg-opacity-20 px-3 py-1 rounded-xl text-sm font-semibold hover:bg-opacity-30 transition"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Profile Card - Overlapping Header */}
      <div className="mx-4 -mt-10">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-800 truncate">{user?.name}</h2>
              <p className="text-gray-500 text-sm truncate">{user?.email || 'No email added'}</p>
              <p className="text-gray-500 text-sm">📱 +91 {user?.phone}</p>
              <span className="inline-block bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full mt-1 capitalize">
                {user?.user_type}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xl font-bold text-purple-600">₹0</p>
              <p className="text-gray-400 text-xs mt-0.5">Wallet</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xl font-bold text-blue-500">0</p>
              <p className="text-gray-400 text-xs mt-0.5">Calls</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">0</p>
              <p className="text-gray-400 text-xs mt-0.5">Chats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="mx-4 mt-4 space-y-4">
        {menuItems.map(section => (
          <div key={section.section}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.section}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition text-left ${
                    index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  <span className={`flex-1 font-medium text-sm ${item.danger ? 'text-red-500' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  <span className="text-gray-400 text-sm">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-red-50 border-2 border-red-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-100 transition flex items-center justify-center gap-2"
        >
          🚪 Logout
        </button>

        {/* App Version */}
        <p className="text-center text-gray-400 text-xs pb-2">
          Creator Hub v1.0.0 • Made with ❤️ in India
        </p>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                    📷
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={user?.phone}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1 px-1">Phone number cannot be changed</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleSaveProfile}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">🚪</p>
              <h2 className="text-xl font-bold text-gray-800">Logout?</h2>
              <p className="text-gray-500 text-sm mt-2">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}