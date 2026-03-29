import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import DateRangeFilter from '../components/DateRangeFilter'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

const TYPE_COLORS = {
  add_money: 'text-emerald-400',
  chat: 'text-teal-400',
  call: 'text-sky-400',
  refund: 'text-amber-400',
  withdrawal: 'text-red-400',
  content_purchase: 'text-pink-400',
}

const TYPE_ICONS = {
  add_money: '💳',
  chat: '💬',
  call: '📞',
  refund: '🔄',
  withdrawal: '🏧',
  content_purchase: '📸',
}

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)

  useEffect(() => { fetchTransactions() }, [typeFilter, dateFrom, dateTo])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      let url = `/admin/transactions?type=${typeFilter}&limit=200`
      if (dateFrom) url += `&date_from=${dateFrom}`
      if (dateTo) url += `&date_to=${dateTo}`
      const res = await apiClient.get(url)
      setTransactions(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = (from, to) => {
    setDateFrom(from)
    setDateTo(to)
  }

  return (
    <div className="space-y-3">
      <DateRangeFilter onFilterChange={handleDateFilter} />

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'add_money', 'chat', 'call', 'refund', 'withdrawal'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
              typeFilter === t
                ? 'bg-violet-500 text-white'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
            }`}
          >
            {TYPE_ICONS[t] || '📋'} {t === 'all' ? 'All' : t.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-gray-600 text-[10px] font-bold">{transactions.length} results</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState icon="📋" message="No transactions found" />
      ) : (
        transactions.map(t => (
          <div key={t.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{TYPE_ICONS[t.type] || '📋'}</span>
                  <span className={`text-xs font-bold ${TYPE_COLORS[t.type] || 'text-gray-400'}`}>
                    {t.type?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[9px] text-gray-700">#{t.id}</span>
                </div>
                <p className="text-white font-black text-lg">₹{Number(t.amount || 0).toFixed(2)}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>

            {/* Split details */}
            {(t.creator_amount > 0 || t.commission_amount > 0) && (
              <div className="flex gap-3 bg-gray-800/50 rounded-xl p-2 mb-2">
                <div>
                  <p className="text-[9px] text-gray-600">Creator</p>
                  <p className="text-xs font-bold text-emerald-400">₹{Number(t.creator_amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600">Commission</p>
                  <p className="text-xs font-bold text-violet-400">₹{Number(t.commission_amount || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* People */}
            <div className="flex gap-4 text-[10px]">
              {t.user_name && (
                <span className="text-gray-500">👤 {t.user_name}</span>
              )}
              {t.creator_name && (
                <span className="text-gray-500">🎨 {t.creator_name}</span>
              )}
            </div>

            {t.description && (
              <p className="text-[10px] text-gray-600 mt-1 truncate">{t.description}</p>
            )}

            <p className="text-[9px] text-gray-700 mt-1">
              {new Date(t.created_at).toLocaleString('en-IN')}
            </p>
          </div>
        ))
      )}
    </div>
  )
}