import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletAPI } from '../api/wallet'

const CREDIT_TYPES = ['add_money', 'signup_bonus', 'first_deposit_bonus', 'event_bonus', 'promo_bonus', 'refund', 'adjustment']

export default function TransactionPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await walletAPI.getTransactions()
        setTransactions(data.transactions || [])
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'add_money', label: 'Added' },
    { id: 'spent', label: 'Spent' },
  ]

  const isCredit = (t) => CREDIT_TYPES.includes(t.type) || t.transaction_type === 'credit'

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    if (filter === 'add_money') return isCredit(t)
    if (filter === 'spent') return !isCredit(t)
    return true
  })

  const getTransactionIcon = (t) => {
    const type = t.type || ''
    if (type.includes('bonus') || type.includes('promo')) return '🎁'
    const desc = t.description?.toLowerCase() || ''
    if (desc.includes('call')) return '📞'
    if (desc.includes('chat')) return '💬'
    if (desc.includes('recharge') || desc.includes('wallet')) return '💰'
    if (desc.includes('content')) return '🔒'
    return '💳'
  }

  const totalAdded = transactions
    .filter(t => isCredit(t))
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  const totalSpent = transactions
    .filter(t => !isCredit(t))
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition"
          >
            ‹
          </button>
          <h1 className="text-xl font-bold">Transaction History</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-white text-xs mb-1">Total Added</p>
            <p className="text-2xl font-bold text-green-300">₹{totalAdded.toFixed(2)}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-white text-xs mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-red-300">₹{totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition ${
              filter === f.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl mt-2">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-gray-500 font-semibold">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
                {getTransactionIcon(transaction)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">
                  {transaction.description || 'Transaction'}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {new Date(transaction.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isCredit(transaction)
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {isCredit(transaction) ? 'Credit' : 'Debit'}
                </span>
              </div>
              <p className={`font-bold text-base flex-shrink-0 ${
                isCredit(transaction) ? 'text-green-500' : 'text-red-500'
              }`}>
                {isCredit(transaction) ? '+' : '-'}₹{Math.abs(Number(transaction.amount)).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}