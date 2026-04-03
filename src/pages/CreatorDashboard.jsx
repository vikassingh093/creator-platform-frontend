import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'
import BottomNav from '../components/BottomNav'
import { getPhotoUrl } from '../utils/photoUrl'

export default function CreatorDashboard() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('home')
  const [activeRooms, setActiveRooms] = useState([])
  const [stats, setStats] = useState(null)
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 })
  const [recentReviews, setRecentReviews] = useState([])
  const [recentChats, setRecentChats] = useState([])
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [myContent, setMyContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)

  // ✅ Online customers state
  const [onlineCustomers, setOnlineCustomers] = useState([])
  const [onlineLoading, setOnlineLoading] = useState(false)

  // ✅ Photo upload state
  const [photoStatus, setPhotoStatus] = useState('none')
  const [pendingPhoto, setPendingPhoto] = useState(null)
  const [rejectReason, setRejectReason] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState('upi')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadType, setUploadType] = useState('image')
  const [uploadPrice, setUploadPrice] = useState('0')
  const [uploadIsFree, setUploadIsFree] = useState(true)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    fetchDashboard()
    fetchActiveChats()
    fetchPhotoStatus()
    const interval = setInterval(fetchActiveChats, 5000)
    const callInterval = setInterval(checkIncomingCalls, 3000)
    return () => {
      clearInterval(interval)
      clearInterval(callInterval)
    }
  }, [])

  // ✅ Fetch online customers when tab is active — auto-refresh every 10s
  useEffect(() => {
    if (activeTab === 'online') {
      fetchOnlineCustomers()
      const onlineInterval = setInterval(fetchOnlineCustomers, 10000)
      return () => clearInterval(onlineInterval)
    }
  }, [activeTab])

  // ✅ Fetch photo status
  const fetchPhotoStatus = async () => {
    try {
      const res = await apiClient.get('/creators/photo/status')
      setPhotoStatus(res.data.photo_status || 'none')
      setPendingPhoto(res.data.pending_photo)
      setRejectReason(res.data.reject_reason)
    } catch (err) {
      console.error('Photo status error:', err)
    }
  }

  // ✅ Handle photo file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, WEBP allowed')
      return
    }
    setSelectedPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // ✅ Upload photo
  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedPhoto)
      const res = await apiClient.post('/creators/photo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPhotoStatus('pending')
      setPendingPhoto(res.data.pending_photo)
      setShowPhotoUpload(false)
      setSelectedPhoto(null)
      setPhotoPreview(null)
      alert('Photo uploaded! Waiting for admin approval.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  const fetchOnlineCustomers = async () => {
    setOnlineLoading(true)
    try {
      const res = await apiClient.get('/creators/online-customers')
      setOnlineCustomers(res.data.customers || [])
    } catch (err) {
      console.error('Error fetching online customers:', err)
    } finally {
      setOnlineLoading(false)
    }
  }

  const handleChatWithCustomer = async (customerId) => {
    try {
      const res = await apiClient.post(`/chat/creator/start-with-customer/${customerId}`)
      const room = res.data
      navigate(`/chat/${user.id}?roomId=${room.room_id || room.id}`)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start chat')
    }
  }

  const handleCallCustomer = async (customerId, callType) => {
    try {
      const res = await apiClient.post('/calls/creator-initiate', {
        customer_id: customerId,
        call_type: callType
      })
      const data = res.data
      navigate('/call', {
        state: {
          roomId: data.room_id,
          channelName: data.channel_name,
          token: data.token,
          uid: data.uid,
          callType: callType,
          creatorName: data.customer?.name || 'Customer',
          ratePerMinute: data.rate_per_minute,
          balance: 0,
          creatorId: customerId,
          initiatedBy: 'creator'
        }
      })
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start call')
    }
  }

  const checkIncomingCalls = async () => {
    try {
      const res = await apiClient.get('/calls/incoming')
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

  const acceptCall = async () => {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null)
    navigate(`/creator-call/${call.room_id}`, {
      state: {
        roomId: call.room_id,
        channelName: call.channel_name,
        token: call.token,
        appId: call.app_id,
        callType: call.call_type,
        callerName: call.caller_name
      }
    })
  }

  const rejectCall = async () => {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null)
    try {
      await apiClient.post('/calls/end', { room_id: call.room_id, duration: 0 })
    } catch (e) {}
  }

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/creators/dashboard')
      setStats(res.data.stats)
      setIsOnline(res.data.is_online)
      setWallet(res.data.wallet || { balance: 0, total_earned: 0, total_withdrawn: 0 })
      setRecentReviews(res.data.recent_reviews || [])
      setRecentChats(res.data.recent_chats || [])
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveChats = async () => {
    try {
      const res = await apiClient.get('/chat/creator/active-rooms')
      setActiveRooms(res.data.rooms || [])
    } catch (err) {}
  }

  const fetchWithdrawalHistory = async () => {
    try {
      const res = await apiClient.get('/creators/withdrawal/history')
      setWithdrawalHistory(res.data.requests || [])
    } catch (err) {}
  }

  const fetchMyContent = async () => {
    try {
      const res = await apiClient.get('/creators/content/my')
      setMyContent(res.data.content || [])
    } catch (err) {}
  }

  const toggleOnline = async () => {
    try {
      const res = await apiClient.post('/creators/toggle-online')
      setIsOnline(res.data.is_online)
    } catch (err) {
      alert('Failed to update status. Please try again.')
    }
  }

  const handleWithdraw = async () => {
    setWithdrawError('')
    if (!withdrawAmount || Number(withdrawAmount) < 100) {
      setWithdrawError('Minimum withdrawal is ₹100'); return
    }
    setWithdrawLoading(true)
    try {
      await apiClient.post('/creators/withdrawal/request', {
        amount: Number(withdrawAmount), method: 'manual',
        upi_id: null, bank_name: null,
        account_number: null, ifsc_code: null,
        account_holder: null,
      })
      setShowWithdrawForm(false)
      setWithdrawAmount('')
      fetchDashboard(); fetchWithdrawalHistory()
      alert('Withdrawal request submitted successfully!')
    } catch (err) {
      setWithdrawError(err.response?.data?.detail || 'Failed to submit request')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleUpload = async () => {
    setUploadError('')
    if (!uploadTitle.trim()) { setUploadError('Title is required'); return }
    if (!uploadFile) { setUploadError('Please select a file'); return }
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadTitle)
      formData.append('description', uploadDesc)
      formData.append('content_type', uploadType)
      formData.append('price', uploadIsFree ? '0' : uploadPrice)
      formData.append('is_free', uploadIsFree ? '1' : '0')
      formData.append('file', uploadFile)
      await apiClient.post('/creators/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowUploadForm(false)
      setUploadTitle(''); setUploadDesc(''); setUploadFile(null)
      setUploadPrice('0'); setUploadIsFree(true)
      fetchMyContent()
      alert('Content uploaded! Pending admin approval.')
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadLoading(false)
    }
  }

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-[#FFC629]' : 'text-gray-200'}>★</span>
    ))

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-[#00C851] bg-opacity-10 text-[#00C851]'
      case 'rejected': return 'bg-red-100 text-red-600'
      default: return 'bg-[#FFF8E1] text-[#FFA500]'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24">

      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-10 pb-16 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* ✅ Profile Photo with upload indicator */}
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="relative flex-shrink-0 active:scale-90 transition"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#1D1D1D] shadow-lg">
                {getPhotoUrl(user?.profile_photo) ? (
                  <img src={getPhotoUrl(user?.profile_photo)} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* Status badge */}
              {photoStatus === 'pending' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FFA500] rounded-full flex items-center justify-center border-2 border-[#FFC629]">
                  <span className="text-white text-[8px]">⏳</span>
                </div>
              )}
              {photoStatus === 'rejected' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#FFC629]">
                  <span className="text-white text-[8px]">✕</span>
                </div>
              )}
              {(photoStatus === 'none' || photoStatus === 'approved') && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1D1D1D] rounded-full flex items-center justify-center border-2 border-[#FFC629]">
                  <span className="text-[8px]">📷</span>
                </div>
              )}
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-[#1D1D1D]">Creator Dashboard</h1>
              <p className="text-[#1D1D1D] opacity-60 text-xs mt-0.5">Welcome, {user?.name}!</p>
            </div>
          </div>
          <button
            onClick={toggleOnline}
            className={`px-4 py-2 rounded-full font-extrabold text-sm transition shadow ${
              isOnline
                ? 'bg-[#00C851] text-white'
                : 'bg-[#1D1D1D] text-[#FFC629]'
            }`}
          >
            {isOnline ? '● Online' : '● Offline'}
          </button>
        </div>
      </div>

      {/* Tabs — with Online tab */}
      <div className="mx-4 -mt-6 mb-4">
        <div className="bg-white rounded-2xl shadow-sm flex overflow-x-auto border-2 border-[#FFF8E1]">
          {[
            { key: 'home', label: '🏠 Home' },
            { key: 'online', label: '👥 Online' },
            { key: 'wallet', label: '💰 Wallet' },
            { key: 'withdrawals', label: '🏧 Withdraw' },
            { key: 'reviews', label: '⭐ Reviews' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key === 'withdrawals') fetchWithdrawalHistory()
              }}
              className={`flex-shrink-0 px-4 py-3 text-xs font-extrabold transition ${
                activeTab === tab.key
                  ? 'text-[#1D1D1D] border-b-2 border-[#FFC629]'
                  : 'text-[#AAAAAA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── HOME TAB ── */}
      {activeTab === 'home' && (
        <div className="mx-4 space-y-4">

          {/* ✅ Photo Status Banner */}
          {photoStatus === 'pending' && (
            <div className="bg-[#FFF8E1] rounded-2xl p-4 border border-[#FFC629]/30 flex items-center gap-3">
              {pendingPhoto && (
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#FFA500]">
                  <img src={getPhotoUrl(pendingPhoto)} alt="Pending" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-extrabold text-[#FFA500]">⏳ Photo Pending Approval</p>
                <p className="text-xs text-[#757575] mt-0.5">Your new profile photo is being reviewed by admin.</p>
              </div>
            </div>
          )}
          {photoStatus === 'rejected' && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">❌</span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-red-600">Photo Rejected</p>
                <p className="text-xs text-red-400 mt-0.5">{rejectReason || 'Photo not appropriate'}</p>
                <button
                  onClick={() => { setShowPhotoUpload(true); setPhotoStatus('none') }}
                  className="mt-2 bg-red-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl active:scale-95 transition"
                >
                  📷 Upload New Photo
                </button>
              </div>
            </div>
          )}

          {/* Active Chats */}
          <div className="bg-white rounded-3xl shadow-sm p-4 border border-[#F0F0F0]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-[#1D1D1D]">
                🔴 Active Chats
                {activeRooms.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeRooms.length}
                  </span>
                )}
              </h2>
              <button onClick={fetchActiveChats} className="text-xs text-[#FFA500] font-bold">Refresh</button>
            </div>
            {activeRooms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-[#AAAAAA] text-sm">
                  {isOnline ? 'Waiting for customers...' : 'Go online to receive chats'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRooms.map(room => (
                  <div key={room.id} className="flex items-center gap-3 bg-[#FFF8E1] rounded-2xl p-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFC629] flex items-center justify-center text-[#1D1D1D] font-extrabold flex-shrink-0">
                      {room.user_photo
                        ? <img src={room.user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                        : room.user_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-[#1D1D1D] text-sm">{room.user_name}</p>
                      <p className="text-xs text-[#AAAAAA]">
                        {new Date(room.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/chat/${user.id}?roomId=${room.id}`)}
                      className="bg-[#FFC629] text-[#1D1D1D] text-xs font-extrabold px-4 py-2 rounded-xl"
                    >
                      Open 💬
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-[#F0F0F0]">
              <p className="text-2xl font-extrabold text-[#FFA500]">₹{stats?.today_earnings?.toFixed(2) || '0.00'}</p>
              <p className="text-[#AAAAAA] text-xs mt-1">Today's Earnings</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-[#F0F0F0]">
              <p className="text-2xl font-extrabold text-[#1D1D1D]">{stats?.total_chats || 0}</p>
              <p className="text-[#AAAAAA] text-xs mt-1">Total Chats</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-[#F0F0F0]">
              <p className="text-2xl font-extrabold text-[#00C851]">₹{stats?.total_earnings?.toFixed(2) || '0.00'}</p>
              <p className="text-[#AAAAAA] text-xs mt-1">Total Earnings</p>
            </div>
            <div className="bg-[#FFC629] rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-extrabold text-[#1D1D1D]">{stats?.rating?.toFixed(1) || '0.0'} ⭐</p>
              <p className="text-[#1D1D1D] opacity-60 text-xs mt-1">Rating</p>
            </div>
          </div>

          {/* Recent Chats */}
          {recentChats.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
              <h3 className="font-extrabold text-[#1D1D1D] mb-3">💬 Recent Chats</h3>
              <div className="space-y-2">
                {recentChats.map(chat => (
                  <div key={chat.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFC629] flex items-center justify-center text-[#1D1D1D] text-sm font-extrabold flex-shrink-0">
                      {chat.user_photo
                        ? <img src={chat.user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                        : chat.user_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-[#1D1D1D]">{chat.user_name}</p>
                      <p className="text-xs text-[#AAAAAA]">
                        {new Date(chat.created_at).toLocaleDateString('en-IN')}
                        {' • '}
                        <span className={chat.status === 'active' ? 'text-[#00C851]' : 'text-[#AAAAAA]'}>{chat.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ONLINE CUSTOMERS TAB ── */}
      {activeTab === 'online' && (
        <div className="mx-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm p-4 border border-[#F0F0F0]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-[#1D1D1D]">
                👥 Online Customers
                {onlineCustomers.length > 0 && (
                  <span className="ml-2 bg-[#00C851] text-white text-xs px-2 py-0.5 rounded-full">
                    {onlineCustomers.length}
                  </span>
                )}
              </h2>
              <button onClick={fetchOnlineCustomers} className="text-xs text-[#FFA500] font-bold">
                {onlineLoading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
            <div className="bg-[#FFF8E1] rounded-2xl p-3 mb-3">
              <p className="text-xs text-[#757575]">
                🟢 Showing customers active in the last 2 minutes. Auto-refreshes every 10 seconds.
              </p>
            </div>
            {onlineLoading && onlineCustomers.length === 0 && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-[#FFC629] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[#AAAAAA] text-sm">Finding online customers...</p>
              </div>
            )}
            {!onlineLoading && onlineCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">😴</p>
                <p className="text-[#AAAAAA] font-semibold">No customers online right now</p>
                <p className="text-[#AAAAAA] text-xs mt-1">
                  {isOnline
                    ? 'Customers will appear here when they open the app'
                    : 'Go online first to be discoverable by customers'}
                </p>
              </div>
            )}
            {onlineCustomers.length > 0 && (
              <div className="space-y-3">
                {onlineCustomers.map(customer => (
                  <div key={customer.id} className="bg-[#F8F8F8] rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#FFC629] flex items-center justify-center text-[#1D1D1D] font-extrabold text-lg overflow-hidden">
                          {customer.profile_photo
                            ? <img src={customer.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                            : customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00C851] border-2 border-white rounded-full"></span>
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-[#1D1D1D]">{customer.name}</p>
                        <p className="text-xs text-[#00C851] font-semibold">● Online now</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleChatWithCustomer(customer.id)} className="flex-1 bg-[#FFC629] text-[#1D1D1D] text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1">💬 Chat</button>
                      <button onClick={() => handleCallCustomer(customer.id, 'audio')} className="flex-1 bg-[#00C851] text-white text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1">📞 Audio</button>
                      <button onClick={() => handleCallCustomer(customer.id, 'video')} className="flex-1 bg-[#7C3AED] text-white text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1">🎥 Video</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WALLET TAB ── */}
      {activeTab === 'wallet' && (
        <div className="mx-4 space-y-4">
          <div className="bg-[#FFC629] rounded-3xl p-6">
            <p className="text-sm text-[#1D1D1D] opacity-60">Available Balance</p>
            <p className="text-4xl font-extrabold text-[#1D1D1D] mt-1">₹{wallet.balance?.toFixed(2) || '0.00'}</p>
            <button onClick={() => { setActiveTab('withdrawals'); setShowWithdrawForm(true) }} className="mt-4 bg-[#1D1D1D] text-[#FFC629] font-extrabold px-6 py-2 rounded-2xl text-sm">🏧 Request Withdrawal</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-[#F0F0F0]">
              <p className="text-xl font-extrabold text-[#00C851]">₹{wallet.total_earned?.toFixed(2) || '0.00'}</p>
              <p className="text-[#AAAAAA] text-xs mt-1">Total Earned</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-[#F0F0F0]">
              <p className="text-xl font-extrabold text-[#FFA500]">₹{wallet.total_withdrawn?.toFixed(2) || '0.00'}</p>
              <p className="text-[#AAAAAA] text-xs mt-1">Total Withdrawn</p>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAWALS TAB ── */}
      {activeTab === 'withdrawals' && (
        <div className="mx-4 space-y-4">
          {!showWithdrawForm && (
            <button onClick={() => setShowWithdrawForm(true)}
              className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-4 rounded-2xl shadow">
              + New Withdrawal Request
            </button>
          )}
          {showWithdrawForm && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F0F0F0]">
              <h3 className="font-extrabold text-[#1D1D1D] mb-4">🏧 Request Withdrawal</h3>
              <p className="text-xs text-[#757575] mb-3">
                Available: <span className="font-extrabold text-[#00C851]">₹{wallet.balance?.toFixed(2)}</span>
              </p>
              <div className="mb-3">
                <label className="text-xs font-extrabold text-[#757575] mb-1 block">Amount (Min ₹100)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-[#F8F8F8] border-2 border-transparent focus:border-[#FFC629] rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>
              <div className="bg-[#FFF8E1] rounded-2xl p-3 mb-3">
                <p className="text-xs text-[#757575]">💡 Submit your withdrawal amount. Payment will be processed by admin to your registered payment details.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowWithdrawForm(false); setWithdrawError('') }}
                  className="flex-1 bg-[#F8F8F8] text-[#757575] font-extrabold py-3 rounded-2xl text-sm">Cancel</button>
                <button onClick={handleWithdraw} disabled={withdrawLoading}
                  className="flex-1 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3 rounded-2xl text-sm disabled:opacity-50">
                  {withdrawLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
            <h3 className="font-extrabold text-[#1D1D1D] mb-3">📋 History</h3>
            {withdrawalHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-[#AAAAAA] text-sm">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalHistory.map(req => (
                  <div key={req.id} className="border-2 border-[#F0F0F0] rounded-2xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-[#1D1D1D]">₹{Number(req.amount).toFixed(2)}</p>
                        <p className="text-xs text-[#757575] mt-0.5">
                          {req.method === 'upi' ? `📱 ${req.upi_id}` : `🏦 ${req.bank_name || 'Manual'}`}
                        </p>
                        <p className="text-xs text-[#AAAAAA] mt-0.5">{new Date(req.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className={`text-xs font-extrabold px-2 py-1 rounded-full ${getStatusColor(req.status)}`}>{req.status.toUpperCase()}</span>
                    </div>
                    {req.admin_note && <p className="text-xs text-[#757575] mt-2 bg-[#F8F8F8] rounded-xl p-2">📝 {req.admin_note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="mx-4 space-y-3">
          {recentReviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">⭐</p>
              <p className="text-[#AAAAAA]">No reviews yet</p>
            </div>
          ) : (
            recentReviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFC629] flex items-center justify-center text-[#1D1D1D] font-extrabold overflow-hidden">
                    {review.user_photo
                      ? <img src={review.user_photo} alt="" className="w-full h-full object-cover" />
                      : review.user_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-[#1D1D1D] text-sm">{review.user_name}</p>
                    <div className="flex text-xs">{renderStars(review.rating)}</div>
                  </div>
                  <p className="text-[#AAAAAA] text-xs">{new Date(review.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                {review.comment && <p className="text-[#757575] text-sm">{review.comment}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ Photo Upload Bottom Sheet */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-end justify-center" onClick={() => { setShowPhotoUpload(false); setSelectedPhoto(null); setPhotoPreview(null) }}>
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>

            <div className="px-5 pb-2">
              <h3 className="font-extrabold text-[#1D1D1D] text-lg">📷 Upload Profile Photo</h3>
              <p className="text-[#AAAAAA] text-[10px]">Max 5MB • JPG, PNG, WEBP only • Needs admin approval</p>
            </div>

            {/* Current vs New preview */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-center gap-6">
                {/* Current */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F8F8F8] border-2 border-gray-200 mx-auto">
                    {getPhotoUrl(user?.profile_photo) ? (
                      <img src={getPhotoUrl(user?.profile_photo)} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                        {user?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#AAAAAA] mt-1 font-bold">Current</p>
                </div>

                {photoPreview && (
                  <>
                    <span className="text-[#FFC629] text-xl font-extrabold">→</span>
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#FFC629] mx-auto shadow-lg">
                        <img src={photoPreview} alt="New" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-[#FFC629] mt-1 font-bold">New</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* File picker */}
            <div className="px-5 pb-3">
              <label className="block w-full cursor-pointer">
                <div className="bg-[#F8F8F8] border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#FFC629] transition">
                  <p className="text-3xl mb-2">📸</p>
                  <p className="text-sm font-bold text-[#757575]">
                    {selectedPhoto ? selectedPhoto.name : 'Tap to select photo'}
                  </p>
                  <p className="text-[10px] text-[#AAAAAA] mt-1">
                    {selectedPhoto ? `${(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG, WEBP • Max 5MB'}
                  </p>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>

            {/* Buttons */}
            <div className="px-5 pt-2 pb-8 flex gap-3">
              <button
                onClick={() => { setShowPhotoUpload(false); setSelectedPhoto(null); setPhotoPreview(null) }}
                className="flex-1 bg-[#F5F5F5] text-[#757575] font-extrabold py-3.5 rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePhotoUpload}
                disabled={!selectedPhoto || photoUploading}
                className="flex-1 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-3.5 rounded-2xl text-sm disabled:opacity-40"
              >
                {photoUploading ? 'Uploading...' : '📤 Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-[#FFC629]">
            <div className="w-20 h-20 bg-[#FFC629] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">📞</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1D1D1D] mb-1">Incoming {incomingCall.call_type} Call</h2>
            <p className="text-[#757575] text-sm mb-6">from <span className="font-extrabold text-[#FFA500]">{incomingCall.caller_name}</span></p>
            <div className="flex gap-3">
              <button onClick={rejectCall} className="flex-1 bg-red-500 text-white font-extrabold py-4 rounded-2xl text-lg">📵 Reject</button>
              <button onClick={acceptCall} className="flex-1 bg-[#00C851] text-white font-extrabold py-4 rounded-2xl text-lg">📞 Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}