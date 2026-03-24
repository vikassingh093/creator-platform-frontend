import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'
import BottomNav from '../components/BottomNav'

export default function CreatorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
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
  const [incomingCall, setIncomingCall] = useState(null) // ✅ ADD THIS

  // Withdrawal form
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

  // Content upload form
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
    const interval = setInterval(fetchActiveChats, 5000)
    // ✅ Poll for incoming calls every 3 seconds
    const callInterval = setInterval(checkIncomingCalls, 3000)
    return () => {
      clearInterval(interval)
      clearInterval(callInterval)
    }
  }, [])

  // ✅ ADD THIS FUNCTION
  const checkIncomingCalls = async () => {
    try {
      const res = await apiClient.get('/calls/incoming')
      console.log("📞 Incoming call check:", res.data)
      if (res.data.call) {
        // ✅ Only set if not already showing same call
        setIncomingCall(prev => {
          if (prev?.room_id === res.data.call.room_id) return prev
          return res.data.call
        })
      } else {
        setIncomingCall(null)
      }
    } catch (err) {
      // silent fail
    }
  }

  // ✅ ADD THIS FUNCTION
  const acceptCall = async () => {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null) // ✅ Clear immediately so it doesn't reappear
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
    setIncomingCall(null) // ✅ Clear immediately
    try {
      await apiClient.post('/calls/end', {
        room_id: call.room_id,
        duration: 0
      })
      console.log("✅ Call rejected and ended")
    } catch (e) {
      console.error("Reject error:", e)
    }
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
    } catch (err) {
      console.error('Active rooms error:', err)
    }
  }

  const fetchWithdrawalHistory = async () => {
    try {
      const res = await apiClient.get('/creators/withdrawal/history')
      setWithdrawalHistory(res.data.requests || [])
    } catch (err) {
      console.error('Withdrawal history error:', err)
    }
  }

  const fetchMyContent = async () => {
    try {
      const res = await apiClient.get('/creators/content/my')
      setMyContent(res.data.content || [])
    } catch (err) {
      console.error('Content error:', err)
    }
  }

  const toggleOnline = async () => {
    try {
      const res = await apiClient.post('/creators/toggle-online')
      // ✅ Use actual response value not local toggle
      setIsOnline(res.data.is_online)
    } catch (err) {
      console.error('Toggle error:', err)
      alert('Failed to update status. Please try again.')
    }
  }

  const handleWithdraw = async () => {
    setWithdrawError('')
    if (!withdrawAmount || Number(withdrawAmount) < 100) {
      setWithdrawError('Minimum withdrawal is ₹100')
      return
    }
    if (withdrawMethod === 'upi' && !upiId) {
      setWithdrawError('UPI ID is required')
      return
    }
    if (withdrawMethod === 'bank' && (!bankName || !accountNumber || !ifscCode)) {
      setWithdrawError('All bank details are required')
      return
    }

    setWithdrawLoading(true)
    try {
      await apiClient.post('/creators/withdrawal/request', {
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        upi_id: upiId || null,
        bank_name: bankName || null,
        account_number: accountNumber || null,
        ifsc_code: ifscCode || null,
        account_holder: accountHolder || null,
      })
      setShowWithdrawForm(false)
      setWithdrawAmount('')
      setUpiId('')
      setBankName('')
      setAccountNumber('')
      setIfscCode('')
      setAccountHolder('')
      fetchDashboard()
      fetchWithdrawalHistory()
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
      setUploadTitle('')
      setUploadDesc('')
      setUploadFile(null)
      setUploadPrice('0')
      setUploadIsFree(true)
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
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-yellow-100 text-yellow-700'
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
          <button
            onClick={toggleOnline}
            className={`px-4 py-2 rounded-full font-bold text-sm transition ${
              isOnline ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
            }`}
          >
            {isOnline ? '🟢 Online' : '⚫ Offline'}
          </button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="mx-4 -mt-6 mb-4">
        <div className="bg-white rounded-2xl shadow-sm flex overflow-x-auto">
          {[
            { key: 'home', label: '🏠 Home' },
            { key: 'wallet', label: '💰 Wallet' },
            { key: 'withdrawals', label: '🏧 Withdraw' },
            { key: 'content', label: '📸 Content' },
            { key: 'reviews', label: '⭐ Reviews' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition ${
                activeTab === tab.key
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── HOME TAB ─────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="mx-4 space-y-4">

          {/* Active Chats */}
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">
                🔴 Active Chats
                {activeRooms.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeRooms.length}
                  </span>
                )}
              </h2>
              <button onClick={fetchActiveChats} className="text-xs text-pink-600 font-semibold">
                Refresh
              </button>
            </div>
            {activeRooms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-gray-400 text-sm">
                  {isOnline ? 'Waiting for customers...' : 'Go online to receive chats'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRooms.map(room => (
                  <div key={room.id} className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {room.user_photo
                        ? <img src={room.user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                        : room.user_name?.charAt(0)
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{room.user_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(room.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-pink-600">₹{stats?.today_earnings?.toFixed(2) || '0.00'}</p>
              <p className="text-gray-400 text-xs mt-1">Today's Earnings</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.total_chats || 0}</p>
              <p className="text-gray-400 text-xs mt-1">Total Chats</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">₹{stats?.total_earnings?.toFixed(2) || '0.00'}</p>
              <p className="text-gray-400 text-xs mt-1">Total Earnings</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats?.rating?.toFixed(1) || '0.0'} ⭐</p>
              <p className="text-gray-400 text-xs mt-1">Rating</p>
            </div>
          </div>

          {/* Recent Chats */}
          {recentChats.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">💬 Recent Chats</h3>
              <div className="space-y-2">
                {recentChats.map(chat => (
                  <div key={chat.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {chat.user_photo
                        ? <img src={chat.user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                        : chat.user_name?.charAt(0)
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{chat.user_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(chat.created_at).toLocaleDateString('en-IN')}
                        {' • '}
                        <span className={chat.status === 'active' ? 'text-green-500' : 'text-gray-400'}>
                          {chat.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WALLET TAB ───────────────────────────── */}
      {activeTab === 'wallet' && (
        <div className="mx-4 space-y-4">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-6 text-white">
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-4xl font-bold mt-1">₹{wallet.balance?.toFixed(2) || '0.00'}</p>
            <button
              onClick={() => { setActiveTab('withdrawals'); setShowWithdrawForm(true) }}
              className="mt-4 bg-white text-pink-600 font-bold px-6 py-2 rounded-2xl text-sm"
            >
              🏧 Request Withdrawal
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-green-600">₹{wallet.total_earned?.toFixed(2) || '0.00'}</p>
              <p className="text-gray-400 text-xs mt-1">Total Earned</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-purple-600">₹{wallet.total_withdrawn?.toFixed(2) || '0.00'}</p>
              <p className="text-gray-400 text-xs mt-1">Total Withdrawn</p>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAWALS TAB ──────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="mx-4 space-y-4">

          {/* Request Button */}
          {!showWithdrawForm && (
            <button
              onClick={() => setShowWithdrawForm(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl"
            >
              + New Withdrawal Request
            </button>
          )}

          {/* Withdrawal Form */}
          {showWithdrawForm && (
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">🏧 Request Withdrawal</h3>

              <p className="text-xs text-gray-500 mb-3">
                Available: <span className="font-bold text-green-600">₹{wallet.balance?.toFixed(2)}</span>
              </p>

              {/* Amount */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Amount (Min ₹100)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                />
              </div>

              {/* Method */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawMethod('upi')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                      withdrawMethod === 'upi'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    📱 UPI
                  </button>
                  <button
                    onClick={() => setWithdrawMethod('bank')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                      withdrawMethod === 'bank'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🏦 Bank
                  </button>
                </div>
              </div>

              {/* UPI Fields */}
              {withdrawMethod === 'upi' && (
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              )}

              {/* Bank Fields */}
              {withdrawMethod === 'bank' && (
                <div className="space-y-3 mb-3">
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={e => setAccountHolder(e.target.value)}
                    placeholder="Account Holder Name"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="Bank Name"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value)}
                    placeholder="IFSC Code"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              )}

              {withdrawError && (
                <p className="text-red-500 text-xs mb-3">{withdrawError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowWithdrawForm(false); setWithdrawError('') }}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-50"
                >
                  {withdrawLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}

          {/* Withdrawal History */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">📋 History</h3>
            {withdrawalHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-400 text-sm">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalHistory.map(req => (
                  <div key={req.id} className="border border-gray-100 rounded-2xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">₹{Number(req.amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.method === 'upi' ? `📱 ${req.upi_id}` : `🏦 ${req.bank_name}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(req.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(req.status)}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    {req.admin_note && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-xl p-2">
                        📝 {req.admin_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENT TAB ──────────────────────────── */}
      {activeTab === 'content' && (
        <div className="mx-4 space-y-4">

          {/* Upload Button */}
          {!showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl"
            >
              + Upload New Content
            </button>
          )}

          {/* Upload Form */}
          {showUploadForm && (
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">📸 Upload Content</h3>

              <div className="space-y-3">
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Title *"
                  className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                />
                <textarea
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                />

                {/* Type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadType('image')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${
                      uploadType === 'image' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🖼️ Image
                  </button>
                  <button
                    onClick={() => setUploadType('video')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${
                      uploadType === 'video' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🎥 Video
                  </button>
                </div>

                {/* Free/Paid */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadIsFree(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${
                      uploadIsFree ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🆓 Free
                  </button>
                  <button
                    onClick={() => setUploadIsFree(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${
                      !uploadIsFree ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💰 Paid
                  </button>
                </div>

                {!uploadIsFree && (
                  <input
                    type="number"
                    value={uploadPrice}
                    onChange={e => setUploadPrice(e.target.value)}
                    placeholder="Price (₹)"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                )}

                {/* File Upload */}
                <label className="block">
                  <div className="w-full bg-gray-100 rounded-2xl px-4 py-6 text-center cursor-pointer border-2 border-dashed border-gray-300">
                    {uploadFile ? (
                      <p className="text-green-600 text-sm font-semibold">✅ {uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="text-3xl mb-1">{uploadType === 'image' ? '🖼️' : '🎥'}</p>
                        <p className="text-gray-400 text-sm">Tap to select {uploadType}</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadError && (
                <p className="text-red-500 text-xs mt-3">{uploadError}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowUploadForm(false); setUploadError('') }}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadLoading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading...' : 'Upload 📤'}
                </button>
              </div>
            </div>
          )}

          {/* Content List */}
          {myContent.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-400">No content uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myContent.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.content_type === 'video' ? '🎥' : '🖼️'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.is_free ? '🆓 Free' : `₹${item.price}`} • {item.content_type}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ──────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="mx-4 space-y-3">
          {recentReviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">⭐</p>
              <p className="text-gray-400">No reviews yet</p>
            </div>
          ) : (
            recentReviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {review.user_photo
                      ? <img src={review.user_photo} alt="" className="w-full h-full object-cover" />
                      : review.user_name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{review.user_name}</p>
                    <div className="flex text-xs">{renderStars(review.rating)}</div>
                  </div>
                  <p className="text-gray-400 text-xs">
                    {new Date(review.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {review.comment && (
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav />

      {/* ✅ Incoming Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="text-6xl mb-3">📞</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Incoming {incomingCall.call_type} Call
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              from <span className="font-bold text-pink-600">{incomingCall.caller_name}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl text-lg"
              >
                📵 Reject
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl text-lg"
              >
                📞 Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}