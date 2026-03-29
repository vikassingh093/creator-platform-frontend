import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionNote, setActionNote] = useState('')
  const [showNoteFor, setShowNoteFor] = useState(null)

  useEffect(() => { fetchWithdrawals() }, [filter])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/admin/withdrawals?status=${filter}`)
      setWithdrawals(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      await apiClient.put(`/admin/withdrawals/${id}`, { action, note: actionNote })
      setShowNoteFor(null)
      setActionNote('')
      fetchWithdrawals()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : withdrawals.length === 0 ? (
        <EmptyState icon="💸" message="No withdrawal requests" />
      ) : (
        withdrawals.map(w => (
          <div key={w.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-black text-xl">₹{Number(w.amount).toFixed(2)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{w.creator_name} • {w.creator_phone}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {w.method === 'upi'
                    ? `📱 UPI: ${w.upi_id}`
                    : `🏦 ${w.bank_name} | ${w.account_number} | ${w.ifsc_code}`
                  }
                </p>
                {w.account_holder && <p className="text-[10px] text-gray-600">👤 {w.account_holder}</p>}
              </div>
              <StatusBadge status={w.status} />
            </div>

            {/* Creator wallet info */}
            {w.creator_balance !== undefined && (
              <div className="flex gap-3 bg-gray-800/50 rounded-xl p-2 mb-3">
                <div>
                  <p className="text-[9px] text-gray-600">Balance</p>
                  <p className="text-[10px] font-bold text-emerald-400">₹{Number(w.creator_balance || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600">Total Earned</p>
                  <p className="text-[10px] font-bold text-gray-400">₹{Number(w.total_earned || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600">Withdrawn</p>
                  <p className="text-[10px] font-bold text-amber-400">₹{Number(w.total_withdrawn || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            <p className="text-[9px] text-gray-700 mb-2">
              {new Date(w.created_at).toLocaleString('en-IN')}
            </p>

            {w.status === 'pending' && (
              <>
                {showNoteFor === w.id && (
                  <input
                    type="text"
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="Add note (optional)..."
                    className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-violet-500 mb-2"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (showNoteFor === w.id) handleAction(w.id, 'approved')
                      else setShowNoteFor(w.id)
                    }}
                    className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-500/25 transition"
                  >
                    ✅ {showNoteFor === w.id ? 'Confirm Approve' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      if (showNoteFor === w.id) handleAction(w.id, 'rejected')
                      else setShowNoteFor(w.id)
                    }}
                    className="flex-1 bg-red-500/15 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-xl text-xs hover:bg-red-500/25 transition"
                  >
                    ❌ {showNoteFor === w.id ? 'Confirm Reject' : 'Reject'}
                  </button>
                </div>
              </>
            )}

            {w.admin_note && (
              <p className="text-[10px] text-gray-500 mt-2 bg-gray-800 rounded-xl p-2 border border-gray-700">
                📝 {w.admin_note}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}