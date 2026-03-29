import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import DateRangeFilter from '../components/DateRangeFilter'
import StatCard from '../components/StatCard'

export default function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)

  useEffect(() => { fetchStats() }, [dateFrom, dateTo])

  const fetchStats = async () => {
    setLoading(true)
    try {
      let url = '/admin/stats'
      const params = []
      if (dateFrom) params.push(`date_from=${dateFrom}`)
      if (dateTo) params.push(`date_to=${dateTo}`)
      if (params.length) url += '?' + params.join('&')

      const res = await apiClient.get(url)
      setStats(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (from, to) => {
    setDateFrom(from)
    setDateTo(to)
  }

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!stats) return null

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      <DateRangeFilter onFilterChange={handleFilter} />

      {/* Date range indicator */}
      {(dateFrom || dateTo) && (
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2">
          <p className="text-violet-400 text-xs font-bold">
            📅 {dateFrom || 'Start'} → {dateTo || 'Now'}
          </p>
        </div>
      )}

      {/* ── Platform Overview ── */}
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">📊 Platform Overview</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="👥" label="Total Users" value={stats.total_users} color="text-blue-400" />
          <StatCard icon="🎨" label="Total Creators" value={stats.total_creators} color="text-purple-400" />
          <StatCard icon="📝" label="Users Registered" value={stats.users_registered} color="text-cyan-400" subValue="In date range" />
          <StatCard icon="⏳" label="Pending Approvals" value={stats.pending_approvals} color="text-amber-400" />
        </div>
      </div>

      {/* ── Revenue ── */}
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">💰 Revenue</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="💳"
            label="Total Deposits"
            value={fmt(stats.total_deposits)}
            subValue={`${stats.total_deposits_count} transactions`}
            color="text-emerald-400"
          />
          <StatCard
            icon="🏦"
            label="Today Deposits"
            value={fmt(stats.today_deposits)}
            color="text-green-400"
          />
          <StatCard
            icon="⚡"
            label="Commission Earned"
            value={fmt(stats.commission_earned)}
            color="text-violet-400"
            subValue="Platform's cut"
          />
          <StatCard
            icon="📊"
            label="Today Commission"
            value={fmt(stats.today_commission)}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* ── Calls Breakdown ── */}
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">📞 Calls Breakdown</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🎙️"
            label="Audio Calls"
            value={stats.audio_calls_count}
            subValue={`Revenue: ${fmt(stats.audio_calls_revenue)}`}
            color="text-sky-400"
          />
          <StatCard
            icon="🎥"
            label="Video Calls"
            value={stats.video_calls_count}
            subValue={`Revenue: ${fmt(stats.video_calls_revenue)}`}
            color="text-pink-400"
          />
          <StatCard
            icon="📞"
            label="Total Calls"
            value={stats.all_calls_count}
            subValue={`Total: ${fmt(stats.all_calls_revenue)}`}
            color="text-indigo-400"
          />
          <StatCard
            icon="💬"
            label="Chat Sessions"
            value={stats.chat_sessions_count}
            subValue={`Total: ${fmt(stats.chat_sessions_revenue)}`}
            color="text-teal-400"
          />
        </div>
      </div>

      {/* ── Payouts & Withdrawals ── */}
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">💸 Payouts & Withdrawals</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="✅"
            label="Total Payouts"
            value={fmt(stats.total_payouts)}
            subValue={`${stats.total_payouts_count} approved`}
            color="text-emerald-400"
          />
          <StatCard
            icon="🏧"
            label="Pending Payouts"
            value={fmt(stats.pending_withdrawals_amount)}
            subValue={`${stats.pending_withdrawals_count} pending`}
            color="text-amber-400"
          />
          <StatCard
            icon="🔄"
            label="Refunds"
            value={fmt(stats.refunds_amount)}
            subValue={`${stats.refunds_count} refunds`}
            color="text-red-400"
          />
          <StatCard
            icon="📋"
            label="Total Transactions"
            value={stats.total_transactions_count}
            subValue={`Volume: ${fmt(stats.total_transactions_amount)}`}
            color="text-gray-300"
          />
        </div>
      </div>
    </div>
  )
}