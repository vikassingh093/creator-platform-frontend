import { useState } from 'react'
import apiClient from '../../../api/client'

export default function RefundTab() {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [creatorId, setCreatorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Quick user lookup
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const handleLookup = async () => {
    if (!lookupPhone) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const res = await apiClient.get('/admin/users')
      const users = res.data.data || []
      const found = users.find(u => u.phone?.includes(lookupPhone) || u.name?.toLowerCase().includes(lookupPhone.toLowerCase()))
      if (found) {
        setLookupResult(found)
        setUserId(String(found.id))
      } else {
        setLookupResult({ notFound: true })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleRefund = async () => {
    setError('')
    setResult(null)

    if (!userId || !amount || !reason) {
      setError('User ID, Amount, and Reason are required')
      return
    }
    if (Number(amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (!confirm(`Refund ₹${amount} to User #${userId}?\n\nReason: ${reason}`)) return

    setLoading(true)
    try {
      const res = await apiClient.post('/admin/refund', {
        user_id: Number(userId),
        amount: Number(amount),
        reason,
        reference_id: referenceId || null,
        creator_id: creatorId ? Number(creatorId) : null,
      })
      setResult(res.data)
      setUserId('')
      setAmount('')
      setReason('')
      setReferenceId('')
      setCreatorId('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Refund failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* User Lookup */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <h3 className="text-white font-bold text-sm mb-3">🔍 Find User</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={lookupPhone}
            onChange={e => setLookupPhone(e.target.value)}
            placeholder="Enter phone or name..."
            className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-violet-500"
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading}
            className="bg-violet-500 text-white text-xs font-bold px-4 rounded-xl hover:bg-violet-600 transition disabled:opacity-50"
          >
            {lookupLoading ? '...' : 'Search'}
          </button>
        </div>

        {lookupResult && !lookupResult.notFound && (
          <div className="mt-3 bg-gray-800 rounded-xl p-3 flex items-center gap-3 border border-emerald-500/30">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              {lookupResult.name?.charAt(0)}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{lookupResult.name}</p>
              <p className="text-[10px] text-gray-500">{lookupResult.phone} • ID: {lookupResult.id} • Balance: ₹{Number(lookupResult.wallet_balance || 0).toFixed(2)}</p>
            </div>
            <span className="text-emerald-400 text-lg ml-auto">✓</span>
          </div>
        )}

        {lookupResult?.notFound && (
          <p className="text-red-400 text-xs mt-2">❌ User not found</p>
        )}
      </div>

      {/* Refund Form */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <h3 className="text-white font-bold text-sm mb-4">💰 Process Refund</h3>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">User ID *</label>
            <input
              type="number"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter refund amount"
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why is this refund being issued?"
              rows={2}
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Reference ID</label>
              <input
                type="text"
                value={referenceId}
                onChange={e => setReferenceId(e.target.value)}
                placeholder="call_123, chat_456..."
                className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Creator ID</label>
              <input
                type="number"
                value={creatorId}
                onChange={e => setCreatorId(e.target.value)}
                placeholder="Optional"
                className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-xs font-bold">❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-400 text-xs font-bold">✅ {result.message}</p>
            <p className="text-emerald-600 text-[10px] mt-1">Transaction ID: {result.transaction_id}</p>
          </div>
        )}

        <button
          onClick={handleRefund}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3.5 rounded-xl text-sm hover:from-violet-600 hover:to-purple-700 transition disabled:opacity-50 shadow-lg shadow-violet-500/25"
        >
          {loading ? '⏳ Processing...' : '💰 Process Refund'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs font-bold mb-2">ℹ️ Refund Info</p>
        <ul className="text-[10px] text-gray-600 space-y-1">
          <li>• Refund credits the customer's wallet immediately</li>
          <li>• A refund transaction is recorded for audit</li>
          <li>• This does NOT deduct from creator's wallet (use dispute process for that)</li>
          <li>• Reference ID helps track which call/chat this refund is for</li>
        </ul>
      </div>
    </div>
  )
}