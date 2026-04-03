import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'
import BottomNav from '../components/BottomNav'
import AVATARS from '../constants/avatars'
import { getPhotoUrl } from '../utils/photoUrl'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState(null)

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
  }, [user])

  // Get current avatar (null if not set)
  const currentAvatar = user?.avatar_id ? AVATARS.find(a => a.id === user.avatar_id) : null

  // ✅ Get profile photo URL (for creators who uploaded photos)
  const profilePhotoUrl = getPhotoUrl(user?.profile_photo)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiClient.put('/users/me', { name, email })
      if (res.data.user) setUser(res.data.user)
      setEditing(false)
    } catch (err) {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarSave = async () => {
    if (selectedAvatarId === null) return
    setSavingAvatar(true)
    try {
      const res = await apiClient.put('/users/me', { avatar_id: selectedAvatarId })
      if (res.data.user) setUser(res.data.user)
      setShowAvatarPicker(false)
      setSelectedAvatarId(null)
    } catch (err) {
      alert('Failed to update avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setSavingAvatar(true)
    try {
      const res = await apiClient.put('/users/me', { avatar_id: 0 })
      if (res.data.user) setUser(res.data.user)
      setShowAvatarPicker(false)
      setSelectedAvatarId(null)
    } catch (err) {
      alert('Failed to remove avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  const openAvatarPicker = () => {
    setSelectedAvatarId(user?.avatar_id || null)
    setShowAvatarPicker(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-28">
      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#1D1D1D] rounded-xl flex items-center justify-center active:scale-90 transition"
          >
            <span className="text-[#FFC629] text-lg">←</span>
          </button>
          <h1 className="text-lg font-extrabold text-[#1D1D1D]">My Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
          {/* Avatar + Info */}
          <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] px-5 py-6 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#FFC629] opacity-10 rounded-full"></div>
            <div className="absolute -right-4 bottom-0 w-20 h-20 bg-[#FFC629] opacity-5 rounded-full"></div>

            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar — tap to change */}
              <button
                onClick={openAvatarPicker}
                className="relative flex-shrink-0 active:scale-90 transition"
              >
                {profilePhotoUrl ? (
                  <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-lg shadow-[#FFC629]/20 bg-white">
                    <img
                      src={profilePhotoUrl}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
                    />
                    <div className="w-full h-full items-center justify-center text-[#1D1D1D] text-3xl font-extrabold bg-[#FFC629]" style={{ display: 'none' }}>
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  </div>
                ) : currentAvatar ? (
                  <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-lg shadow-[#FFC629]/20 bg-white">
                    <img src={currentAvatar.img} alt={currentAvatar.label} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-[72px] h-[72px] bg-[#FFC629] rounded-2xl flex items-center justify-center text-[#1D1D1D] text-3xl font-extrabold shadow-lg shadow-[#FFC629]/20">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                {/* Edit badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFC629] rounded-full flex items-center justify-center shadow-md border-2 border-[#1D1D1D]">
                  <span className="text-[10px]">✏️</span>
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <h2 className="text-white font-extrabold text-xl truncate">{user?.name || 'Guest'}</h2>
                <p className="text-white/50 text-sm truncate mt-0.5">{user?.phone || ''}</p>
                <p className="text-white/40 text-xs truncate mt-0.5">{user?.email || ''}</p>
                <p className="text-[#FFC629]/60 text-[10px] mt-1">Tap avatar to customize</p>
              </div>
            </div>
          </div>

          {/* Edit Section */}
          <div className="p-5">
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1">Name</p>
                  <p className="text-[#1D1D1D] font-bold text-sm">{user?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-[#1D1D1D] font-bold text-sm">{user?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1">Email</p>
                  <p className="text-[#1D1D1D] font-bold text-sm">{user?.email || '—'}</p>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3 rounded-xl text-sm active:scale-[0.97] transition mt-2"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1.5">Name</p>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#F8F8F8] border-2 border-gray-200 focus:border-[#FFC629] rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1D] outline-none transition"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1.5">Email</p>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#F8F8F8] border-2 border-gray-200 focus:border-[#FFC629] rounded-xl px-4 py-3 text-sm font-bold text-[#1D1D1D] outline-none transition"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-1.5">Phone (cannot change)</p>
                  <div className="w-full bg-[#F0F0F0] border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#AAAAAA]">
                    {user?.phone || '—'}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { setEditing(false); setName(user?.name || ''); setEmail(user?.email || '') }}
                    className="flex-1 bg-[#F5F5F5] text-[#757575] font-extrabold py-3 rounded-xl text-sm active:scale-[0.97] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3 rounded-xl text-sm active:scale-[0.97] transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '✅ Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest">Quick Links</p>
          </div>

          <button onClick={() => navigate('/wallet')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group">
            <div className="w-10 h-10 bg-[#FFF8E1] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0"><span className="text-lg">💰</span></div>
            <div className="flex-1 min-w-0"><span className="text-[#1D1D1D] text-sm font-bold block">Wallet & Recharge</span><span className="text-[#AAAAAA] text-[10px] block">Balance & payment history</span></div>
            <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
          </button>

          <button onClick={() => {
            const shareText = `🎉 Join CreatorHub & get ₹50 FREE!\n\nDownload: https://creatorhub.app/invite/${user?.id || ''}`
            if (navigator.share) navigator.share({ title: 'CreatorHub', text: shareText }).catch(() => {})
            else { navigator.clipboard.writeText(shareText); alert('Invite link copied! 📋') }
          }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group">
            <div className="w-10 h-10 bg-[#FFF8E1] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0"><span className="text-lg">👥</span></div>
            <div className="flex-1 min-w-0"><span className="text-[#1D1D1D] text-sm font-bold block">Invite Friends</span><span className="text-[#AAAAAA] text-[10px] block">Earn ₹100 per referral</span></div>
            <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
          </button>

          <div className="mx-5 border-t border-gray-100"></div>

          <button onClick={() => navigate('/help')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group">
            <div className="w-10 h-10 bg-[#F5F5F5] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0"><span className="text-lg">❓</span></div>
            <div className="flex-1 min-w-0"><span className="text-[#1D1D1D] text-sm font-bold block">Help & FAQ</span><span className="text-[#AAAAAA] text-[10px] block">Get answers fast</span></div>
            <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
          </button>

          <button onClick={() => navigate('/terms')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group">
            <div className="w-10 h-10 bg-[#F5F5F5] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0"><span className="text-lg">📋</span></div>
            <div className="flex-1 min-w-0"><span className="text-[#1D1D1D] text-sm font-bold block">Terms & Conditions</span><span className="text-[#AAAAAA] text-[10px] block">Our policies</span></div>
            <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
          </button>

          <button onClick={() => alert('Thanks for rating us! ⭐')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group">
            <div className="w-10 h-10 bg-[#F5F5F5] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0"><span className="text-lg">⭐</span></div>
            <div className="flex-1 min-w-0"><span className="text-[#1D1D1D] text-sm font-bold block">Rate Us</span><span className="text-[#AAAAAA] text-[10px] block">Love us? Rate 5 stars!</span></div>
            <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-red-100 text-red-500 font-extrabold py-3.5 rounded-2xl hover:from-red-100 hover:to-red-200 active:scale-[0.97] transition border border-red-100">
          <span className="text-lg">🚪</span><span className="text-sm">Logout</span>
        </button>
        <p className="text-center text-[10px] text-[#CCCCCC] mt-3">CreatorHub v1.0</p>
      </div>

      {/* ✅ Avatar Picker Bottom Sheet — FIXED save button visibility */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-end justify-center" onClick={() => { setShowAvatarPicker(false); setSelectedAvatarId(null) }}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: '70vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-2 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-[#1D1D1D] text-lg">Choose Avatar</h3>
                <p className="text-[#AAAAAA] text-[10px]">Optional — pick one you like!</p>
              </div>
              <button
                onClick={() => { setShowAvatarPicker(false); setSelectedAvatarId(null) }}
                className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center text-[#AAAAAA] hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Current avatar display */}
            <div className="px-5 pb-3 flex-shrink-0">
              <div className="bg-[#F8F8F8] rounded-xl px-4 py-3 flex items-center gap-3">
                {currentAvatar ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm">
                    <img src={currentAvatar.img} alt={currentAvatar.label} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#FFC629] flex items-center justify-center text-[#1D1D1D] font-extrabold text-lg">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[#1D1D1D] text-sm font-bold">
                    {currentAvatar ? currentAvatar.label : 'Default (First Letter)'}
                  </p>
                  <p className="text-[#AAAAAA] text-[10px]">Currently active</p>
                </div>
                {currentAvatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={savingAvatar}
                    className="text-red-400 text-[10px] font-bold bg-red-50 px-2.5 py-1 rounded-lg active:scale-95 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable avatar grid */}
            <div className="px-5 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-4 gap-3 pb-2">
                {AVATARS.map(avatar => {
                  const isSelected = selectedAvatarId === avatar.id
                  const isCurrent = user?.avatar_id === avatar.id
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className="relative flex flex-col items-center gap-1.5 active:scale-90 transition"
                    >
                      <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br ${avatar.bg} p-[2px] transition-all duration-200 ${
                        isSelected
                          ? 'ring-[3px] ring-[#FFC629] ring-offset-2 scale-105 shadow-lg'
                          : isCurrent
                            ? 'ring-2 ring-green-400 ring-offset-1'
                            : 'opacity-70 hover:opacity-100'
                      }`}>
                        <img src={avatar.img} alt={avatar.label} className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <span className={`text-[9px] font-bold truncate w-full text-center ${
                        isSelected ? 'text-[#1D1D1D]' : 'text-[#AAAAAA]'
                      }`}>
                        {avatar.label}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFC629] rounded-full flex items-center justify-center shadow-md">
                          <span className="text-[#1D1D1D] text-[10px] font-extrabold">✓</span>
                        </div>
                      )}
                      {isCurrent && !isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ✅ FIXED: Save button — always visible, never hidden */}
            <div className="px-5 pt-3 pb-8 border-t border-gray-100 flex-shrink-0 bg-white">
              <button
                onClick={handleAvatarSave}
                disabled={savingAvatar || selectedAvatarId === null || selectedAvatarId === user?.avatar_id}
                className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3.5 rounded-2xl text-sm active:scale-[0.97] transition disabled:opacity-40"
              >
                {savingAvatar ? 'Saving...' : selectedAvatarId && selectedAvatarId !== user?.avatar_id ? '✅ Save Avatar' : 'Select an avatar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}