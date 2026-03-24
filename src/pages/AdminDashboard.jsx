import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import useAuthStore from '../store/authStore'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [creators, setCreators] = useState([])
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawalFilter, setWithdrawalFilter] = useState('all')
  const [content, setContent] = useState([])
  const [contentFilter, setContentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionNote, setActionNote] = useState('')
  const [showNoteFor, setShowNoteFor] = useState(null)

  useEffect(() => { fetchStats() }, [])
  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'creators') fetchCreators()
    if (activeTab === 'withdrawals') fetchWithdrawals()
    if (activeTab === 'content') fetchContent()
  }, [activeTab, creatorFilter, withdrawalFilter, contentFilter])

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/stats')
      setStats(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users')
      setUsers(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchCreators = async () => {
    try {
      const res = await apiClient.get(`/admin/creators?status=${creatorFilter}`)
      setCreators(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchWithdrawals = async () => {
    try {
      const res = await apiClient.get(`/admin/withdrawals?status=${withdrawalFilter}`)
      setWithdrawals(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchContent = async () => {
    try {
      const res = await apiClient.get(`/admin/content?status=${contentFilter}`)
      setContent(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const handleCreatorAction = async (creatorProfileId, action) => {
    try {
      await apiClient.put(`/admin/creators/${creatorProfileId}/approve`, { action })
      fetchCreators()
      fetchStats()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      await apiClient.put(`/admin/users/${userId}/block`, { is_blocked: isBlocked })
      fetchUsers()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const handleWithdrawalAction = async (id, action) => {
    try {
      await apiClient.put(`/admin/withdrawals/${id}`, { action, note: actionNote })
      setShowNoteFor(null)
      setActionNote('')
      fetchWithdrawals()
      fetchStats()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const handleContentAction = async (id, action) => {
    try {
      await apiClient.put(`/admin/content/${id}`, { action })
      fetchContent()
      fetchStats()
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
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
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-pink-200 text-sm">Platform Management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="bg-white bg-opacity-20 px-3 py-2 rounded-xl text-sm font-bold">
              🏠 Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 bg-opacity-80 px-3 py-2 rounded-xl text-sm font-bold"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white flex overflow-x-auto border-b border-gray-100 sticky top-0 z-10">
        {[
          { key: 'stats', label: '📊 Stats' },
          { key: 'creators', label: '🎨 Creators' },
          { key: 'users', label: '👥 Users' },
          { key: 'withdrawals', label: '💸 Withdrawals' },
          { key: 'content', label: '📸 Content' },
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

      <div className="p-4">

        {/* ── STATS ─────────────────────────────── */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Users', value: stats.total_users, color: 'text-blue-600', icon: '👥' },
              { label: 'Total Creators', value: stats.total_creators, color: 'text-purple-600', icon: '🎨' },
              { label: 'Pending Approvals', value: stats.pending_approvals, color: 'text-yellow-600', icon: '⏳' },
              { label: 'Total Revenue', value: `₹${Number(stats.total_revenue).toFixed(2)}`, color: 'text-green-600', icon: '💰' },
              { label: 'Pending Withdrawals', value: stats.pending_withdrawals_count, color: 'text-red-600', icon: '🏧' },
              { label: 'Withdrawal Amount', value: `₹${Number(stats.pending_withdrawals_amount).toFixed(2)}`, color: 'text-orange-600', icon: '💸' },
              { label: 'Pending Content', value: stats.pending_content, color: 'text-pink-600', icon: '📸' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── CREATORS ──────────────────────────── */}
        {activeTab === 'creators' && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setCreatorFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                    creatorFilter === f ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {creators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🎨</p>
                <p className="text-gray-400">No creators found</p>
              </div>
            ) : creators.map(creator => (
              <div key={creator.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {creator.profile_photo
                      ? <img src={creator.profile_photo} alt="" className="w-full h-full object-cover" />
                      : creator.name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{creator.name}</p>
                    <p className="text-xs text-gray-500">{creator.phone} • {creator.specialty}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{creator.bio}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    creator.is_approved ? 'bg-green-100 text-green-700' :
                    creator.is_rejected ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {creator.is_approved ? 'Approved' : creator.is_rejected ? 'Rejected' : 'Pending'}
                  </span>
                </div>

                {!creator.is_approved && !creator.is_rejected && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreatorAction(creator.creator_profile_id, 'approve')}
                      className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleCreatorAction(creator.creator_profile_id, 'reject')}
                      className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-sm"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── USERS ─────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-gray-400">No users found</p>
              </div>
            ) : users.map(u => (
              <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.phone} • {u.user_type}</p>
                  <p className="text-xs text-green-600 font-semibold">
                    ₹{Number(u.wallet_balance || 0).toFixed(2)} balance
                  </p>
                </div>
                <button
                  onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl ${
                    u.is_blocked
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {u.is_blocked ? '✅ Unblock' : '🚫 Block'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── WITHDRAWALS ───────────────────────── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setWithdrawalFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                    withdrawalFilter === f ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">💸</p>
                <p className="text-gray-400">No withdrawal requests</p>
              </div>
            ) : withdrawals.map(w => (
              <div key={w.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-800">₹{Number(w.amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{w.creator_name} • {w.creator_phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {w.method === 'upi' ? `📱 UPI: ${w.upi_id}` : `🏦 ${w.bank_name} | ${w.account_number} | ${w.ifsc_code}`}
                    </p>
                    {w.account_holder && <p className="text-xs text-gray-400">👤 {w.account_holder}</p>}
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(w.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(w.status)}`}>
                    {w.status.toUpperCase()}
                  </span>
                </div>

                {w.status === 'pending' && (
                  <>
                    {showNoteFor === w.id && (
                      <input
                        type="text"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                        placeholder="Add note (optional)"
                        className="w-full bg-gray-100 rounded-xl px-3 py-2 text-xs outline-none mb-2"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowNoteFor(w.id)
                          if (showNoteFor === w.id) handleWithdrawalAction(w.id, 'approved')
                        }}
                        className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-xs"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => {
                          setShowNoteFor(w.id)
                          if (showNoteFor === w.id) handleWithdrawalAction(w.id, 'rejected')
                        }}
                        className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-xs"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </>
                )}

                {w.admin_note && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-xl p-2">📝 {w.admin_note}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CONTENT ───────────────────────────── */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setContentFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                    contentFilter === f ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {content.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">📸</p>
                <p className="text-gray-400">No content found</p>
              </div>
            ) : content.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 overflow-hidden flex-shrink-0">
                    {item.thumbnail || item.file_url ? (
                      <img
                        src={item.thumbnail || item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.content_type === 'video' ? '🎥' : '🖼️'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">By {item.creator_name}</p>
                    <p className="text-xs text-gray-400">{item.is_free ? '🆓 Free' : `₹${item.price}`} • {item.content_type}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContentAction(item.id, 'approved')}
                      className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleContentAction(item.id, 'rejected')}
                      className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-sm"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}