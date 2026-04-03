import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { creatorsAPI } from '../api/creators'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'
import BottomNav from '../components/BottomNav'
import AVATARS from '../constants/avatars'
import { getPhotoUrl } from '../utils/photoUrl'

// ✅ Only 3 categories
const CATEGORIES = ['All', '🔮 Astrology', '🎭 Entertainment', '👗 Fashion']
const CATEGORY_MAP = { '🔮 Astrology': 'Astrology', '🎭 Entertainment': 'Entertainment', '👗 Fashion': 'Fashion' }

// ✅ Promo banners
const BANNERS = [
  {
    id: 1,
    title: 'Invite Friends & Earn',
    subtitle: 'Get ₹100 for every friend who joins!',
    emoji: '👥',
    bg: 'from-[#FF6B6B] to-[#FF8E53]',
    cta: 'Invite Now',
    action: 'invite',
  },
  {
    id: 2,
    title: 'First Recharge Bonus',
    subtitle: 'Add ₹500 & get ₹50 extra FREE!',
    emoji: '💰',
    bg: 'from-[#43E97B] to-[#38F9D7]',
    cta: 'Recharge Now',
    action: 'wallet',
  },
  {
    id: 3,
    title: 'New User Offer',
    subtitle: 'Get ₹50 signup bonus in your wallet!',
    emoji: '🎉',
    bg: 'from-[#A18CD1] to-[#FBC2EB]',
    cta: 'Claim Now',
    action: 'wallet',
  },
  {
    id: 4,
    title: 'Chat with Top Creators',
    subtitle: 'First 2 min FREE on your first chat!',
    emoji: '🔮',
    bg: 'from-[#667EEA] to-[#764BA2]',
    cta: 'Explore',
    action: 'home',
  },
]

// ✅ Sidebar menu items
const MENU_ITEMS = [
  { icon: '🏠', label: 'Home', path: '/', desc: 'Browse creators' },
  { icon: '👤', label: 'My Profile', path: '/profile', desc: 'Edit your details' },
  { icon: '💰', label: 'Wallet', path: '/wallet', desc: 'Balance & recharge' },
  { icon: '📜', label: 'Transactions', path: '/wallet', desc: 'Payment history' },
  { icon: '🔔', label: 'Notifications', path: '/notifications', desc: 'Updates & alerts' },
]

const MENU_EXTRAS = [
  { icon: '👥', label: 'Invite Friends', action: 'invite', desc: 'Earn ₹100 per referral' },
  { icon: '❓', label: 'Help & FAQ', path: '/help', desc: 'Get answers fast' },
  { icon: '📋', label: 'Terms & Conditions', path: '/terms', desc: 'Our policies' },
  { icon: '⭐', label: 'Rate Us', action: 'rate', desc: 'Love us? Rate 5 stars!' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (user?.user_type === 'creator') navigate('/creator-dashboard', { replace: true })
    if (user?.user_type === 'admin') navigate('/admin', { replace: true })
  }, [user])

  const [creators, setCreators] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentBanner, setCurrentBanner] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // ✅ Incoming call state for customers
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (selectedCategory !== 'All') params.category = CATEGORY_MAP[selectedCategory] || selectedCategory
        const data = await creatorsAPI.getCreators(params)
        setCreators(data.creators || [])
      } catch (err) {
        setError('Failed to load creators')
      } finally {
        setLoading(false)
      }
    }
    fetchCreators()
  }, [selectedCategory])

  // ✅ Auto-scroll banner every 5 seconds (slower)
  useEffect(() => {
    if (BANNERS.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Banner CTA action
  const handleBannerAction = (action) => {
    if (action === 'wallet') navigate('/wallet')
    else if (action === 'invite') handleShare()
    else if (action === 'home') window.scrollTo({ top: 500, behavior: 'smooth' })
  }

  // ✅ Share / Invite
  const handleShare = () => {
    const shareText = `🎉 Join CreatorHub & get ₹50 FREE! Chat with top Astrologers, Entertainers & Fashion experts.\n\nDownload now: https://creatorhub.app/invite/${user?.id || ''}`
    if (navigator.share) {
      navigator.share({ title: 'CreatorHub', text: shareText }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Invite link copied to clipboard! 📋')
    }
  }

  // ✅ Handle menu item click
  const handleMenuClick = (item) => {
    setMenuOpen(false)
    if (item.path) {
      navigate(item.path)
    } else if (item.action === 'invite') {
      handleShare()
    } else if (item.action === 'rate') {
      alert('Thanks for rating us! ⭐')
    }
  }

  // ✅ Handle logout
  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  // ✅ Poll for incoming calls from creators (every 5 seconds)
  useEffect(() => {
    if (user?.user_type !== 'customer' && user?.user_type !== 'user') return

    let active = true

    const checkIncomingCalls = async () => {
      if (!active) return
      try {
        const res = await apiClient.get('/calls/incoming')
        if (!active) return
        if (res.data.call) {
          setIncomingCall(prev => {
            if (prev?.room_id === res.data.call.room_id) return prev
            return res.data.call
          })
        } else {
          setIncomingCall(null)
        }
      } catch (err) {}
    }

    const callInterval = setInterval(checkIncomingCalls, 5000)
    checkIncomingCalls()

    return () => {
      active = false
      clearInterval(callInterval)
    }
  }, [user])

  // ✅ Accept incoming call from creator
  const acceptCall = async () => {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null)

    try {
      await apiClient.post(`/calls/accept/${call.room_id}`)
    } catch (e) {
      console.error('Accept error:', e)
    }

    navigate('/call', {
      state: {
        roomId: call.room_id,
        channelName: call.channel_name,
        token: call.token,
        uid: call.uid,
        callType: call.call_type,
        creatorName: call.caller_name,
        ratePerMinute: 0,
        balance: 0,
        creatorId: null,
        initiatedBy: 'creator'
      }
    })
  }

  // ✅ Reject incoming call
  const rejectCall = async () => {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null)
    try {
      await apiClient.post(`/calls/reject/${call.room_id}`)
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24">

      {/* ✅ Side Drawer Menu — Premium */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* ✅ Profile Header — Premium gradient */}
          <div className="relative bg-gradient-to-br from-[#1D1D1D] to-[#333333] px-5 pt-14 pb-6 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#FFC629] opacity-10 rounded-full"></div>
            <div className="absolute -right-4 bottom-0 w-20 h-20 bg-[#FFC629] opacity-5 rounded-full"></div>

            {/* Close button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-white/20 transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5">
              {(() => {
                const avatar = user?.avatar_id ? AVATARS.find(a => a.id === user.avatar_id) : null
                return avatar ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-[#FFC629]/20 bg-white">
                    <img src={avatar.img} alt={avatar.label} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-[#FFC629] rounded-2xl flex items-center justify-center text-[#1D1D1D] text-2xl font-extrabold shadow-lg shadow-[#FFC629]/20">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )
              })()}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-white text-lg truncate leading-tight">{user?.name || 'Guest'}</h3>
                <p className="text-white/50 text-xs truncate mt-0.5">{user?.phone || user?.email || ''}</p>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile') }}
                  className="mt-2 bg-[#FFC629] text-[#1D1D1D] text-[10px] font-extrabold px-3 py-1 rounded-full"
                >
                  View Profile →
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Main Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-4 pb-2">
              <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest px-2 mb-2">Menu</p>
              {MENU_ITEMS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMenuClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group mb-0.5"
                >
                  <div className="w-10 h-10 bg-[#FFF8E1] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[#1D1D1D] text-sm font-bold block">{item.label}</span>
                    <span className="text-[#AAAAAA] text-[10px] block">{item.desc}</span>
                  </div>
                  <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100"></div>

            {/* ✅ Extra Items */}
            <div className="px-3 pt-3 pb-2">
              <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest px-2 mb-2">More</p>
              {MENU_EXTRAS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMenuClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#FFF8E1] active:bg-[#FFF3C4] transition text-left group mb-0.5"
                >
                  <div className="w-10 h-10 bg-[#F5F5F5] group-hover:bg-[#FFC629]/20 rounded-xl flex items-center justify-center transition flex-shrink-0">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[#1D1D1D] text-sm font-bold block">{item.label}</span>
                    <span className="text-[#AAAAAA] text-[10px] block">{item.desc}</span>
                  </div>
                  <span className="text-[#CCCCCC] text-xs group-hover:text-[#FFC629] transition">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Logout — Premium */}
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-red-100 text-red-500 font-extrabold py-3.5 rounded-2xl hover:from-red-100 hover:to-red-200 active:scale-[0.97] transition border border-red-100"
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm">Logout</span>
            </button>
            <p className="text-center text-[10px] text-[#CCCCCC] mt-3">CreatorHub v1.0</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-10 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            {/* ✅ Premium Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="w-11 h-11 bg-[#1D1D1D] rounded-2xl flex flex-col items-center justify-center gap-[4.5px] active:scale-90 transition shadow-lg shadow-black/20"
            >
              <span className="w-[18px] h-[2px] bg-[#FFC629] rounded-full transition-all"></span>
              <span className="w-[14px] h-[2px] bg-[#FFC629] rounded-full transition-all ml-[-2px]"></span>
              <span className="w-[18px] h-[2px] bg-[#FFC629] rounded-full transition-all"></span>
            </button>
            <div>
              <p className="text-[#1D1D1D] opacity-60 text-sm font-medium">Welcome back 👋</p>
              <h1 className="text-xl font-extrabold text-[#1D1D1D]">{user?.name}</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-[#1D1D1D] text-[#FFC629] px-4 py-2 rounded-2xl text-sm font-bold shadow-lg shadow-black/20"
          >
            💰 Wallet
          </button>
        </div>

        {/* ✅ Promo / Offer Banner Carousel */}
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {BANNERS.map(banner => (
              <div
                key={banner.id}
                onClick={() => handleBannerAction(banner.action)}
                className="min-w-full cursor-pointer"
              >
                <div className={`relative h-36 bg-gradient-to-r ${banner.bg} rounded-2xl overflow-hidden flex items-center px-5`}>
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-white opacity-10 rounded-full"></div>
                  <div className="absolute -right-2 -bottom-10 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                  <div className="absolute left-1/2 -top-10 w-20 h-20 bg-white opacity-5 rounded-full"></div>

                  {/* Emoji */}
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <span className="text-4xl">{banner.emoji}</span>
                  </div>

                  {/* Text */}
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-white font-extrabold text-lg leading-tight drop-shadow-sm">{banner.title}</p>
                    <p className="text-white text-opacity-80 text-xs mt-1 leading-tight">{banner.subtitle}</p>
                    <div className="mt-3">
                      <span className="bg-white text-[#1D1D1D] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md">
                        {banner.cta} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3 pb-1">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentBanner ? 'bg-[#1D1D1D] w-6' : 'bg-[#1D1D1D] opacity-25 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Categories — hardcoded 3 only */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border-2 ${
                selectedCategory === cat
                  ? 'bg-[#FFC629] text-[#1D1D1D] border-[#FFC629] shadow'
                  : 'bg-white text-[#757575] border-[#E0E0E0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Grid */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">😕</p>
            <p className="text-[#757575]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-[#FFA500] font-bold underline"
            >
              Try Again
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🎭</p>
            <p className="text-[#757575]">No creators in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {creators.map(creator => (
              <button
                key={creator.id}
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-[#FFC629] overflow-hidden text-left transition"
              >
                {/* Photo */}
                <div className="relative">
                  <div className="w-full h-36 bg-[#FFF8E1] flex items-center justify-center text-[#FFA500] text-4xl font-extrabold">
                    <img src={getPhotoUrl(creator.profile_photo)} alt={creator.name} className="w-full h-full object-cover" />
                  </div>
                  {/* Online Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    creator.is_available
                      ? 'bg-[#00C851] text-white'
                      : 'bg-[#AAAAAA] text-white'
                  }`}>
                    {creator.is_available ? '● Online' : '● Offline'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-extrabold text-[#1D1D1D] text-sm truncate">{creator.name}</h3>
                  <p className="text-[#FFA500] text-xs font-bold mt-0.5">{creator.category}</p>
                  <p className="text-[#AAAAAA] text-xs mt-1 line-clamp-2">{creator.bio || 'No bio available'}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[#FFC629] text-xs">⭐</span>
                    <span className="text-[#1D1D1D] text-xs font-bold">
                      {creator.rating ? Number(creator.rating).toFixed(1) : 'New'}
                    </span>
                    {creator.total_reviews > 0 && (
                      <span className="text-[#AAAAAA] text-xs">({creator.total_reviews})</span>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="mt-2">
                    <span className="bg-[#FFF8E1] text-[#FFA500] text-xs px-2 py-0.5 rounded-full font-bold border border-[#FFC629]">
                      💬 ₹{creator.chat_rate}/min
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* ✅ Incoming Call Popup for Customers */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-[#FFC629]">
            <div className="w-20 h-20 bg-[#FFC629] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <span className="text-4xl">{incomingCall.call_type === 'video' ? '🎥' : '📞'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1D1D1D] mb-1">
              Incoming {incomingCall.call_type} Call
            </h2>
            <p className="text-[#757575] text-sm mb-6">
              from <span className="font-extrabold text-[#FFA500]">{incomingCall.caller_name}</span>
            </p>
            <p className="text-xs text-[#AAAAAA] mb-4">
              ⚠️ Charges will apply from your wallet
            </p>
            <div className="flex gap-3">
              <button onClick={rejectCall}
                className="flex-1 bg-red-500 text-white font-extrabold py-4 rounded-2xl text-lg active:scale-95">
                📵 Reject
              </button>
              <button onClick={acceptCall}
                className="flex-1 bg-[#00C851] text-white font-extrabold py-4 rounded-2xl text-lg active:scale-95">
                📞 Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}