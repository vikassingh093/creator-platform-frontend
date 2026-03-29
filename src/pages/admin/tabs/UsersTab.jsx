import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import EmptyState from '../components/EmptyState'

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/users')
      setUsers(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (userId, isBlocked) => {
    try {
      await apiClient.put(`/admin/users/${userId}/block`, { is_blocked: isBlocked })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  )

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search users by name or phone..."
          className="w-full bg-gray-900 text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-800 focus:border-violet-500 placeholder:text-gray-600"
        />
      </div>

      {/* Count */}
      <p className="text-gray-500 text-xs font-bold">{filtered.length} users found</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👥" message="No users found" />
      ) : (
        filtered.map(u => (
          <div key={u.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {u.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{u.name}</p>
              <p className="text-[11px] text-gray-500">{u.phone} • <span className="text-violet-400">{u.user_type}</span></p>
              <p className="text-[11px] text-emerald-400 font-bold">
                ₹{Number(u.wallet_balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <span className="text-[9px] text-gray-600">ID: {u.id}</span>
              <button
                onClick={() => handleBlock(u.id, !u.is_blocked)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${
                  u.is_blocked
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                }`}
              >
                {u.is_blocked ? '✅ Unblock' : '🚫 Block'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}