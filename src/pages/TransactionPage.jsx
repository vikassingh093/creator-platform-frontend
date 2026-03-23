import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockTransactions } from '../utils/mockData'

export default function TransactionPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'add_money', label: 'Added' },
    { id: 'call', label: 'Calls' },
    { id: 'chat', label: 'Chats' },
    { id: 'content', label: 'Content' },
  ]

  const filteredTransactions = mockTransactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'call': return '📞'
      case 'chat': return '💬'
      case 'content': return '🔒'
      case 'add_money': return '💰'
      default: return '💳'
    }
  }

  const getTransactionLabel = (t) => {
    switch (t.type) {
      case 'add_money': return 'Added Money to Wallet'
      case 'call': return `Call with ${t.creator}`
      case 'chat': return `Chat with ${t.creator}`
      case 'content': return `Content from ${t.creator}`
      default: return 'Transaction'
    }
  }

  const totalSpent = mockTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalAdded = mockTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition"
          >
            ‹
          </button>
          <h1 className="text-xl font-bold">Transaction History</h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-white text-xs mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-red-300">₹{totalSpent}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-white text-xs mb-1">Total Added</p>
            <p className="text-2xl font-bold text-green-300">₹{totalAdded}</p>
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
        {filteredTransactions.length === 0 ? (
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
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">
                  {getTransactionLabel(transaction)}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{transaction.date}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                  transaction.type === 'add_money'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {transaction.type === 'add_money' ? 'Credit' : transaction.type}
                </span>
              </div>
              <p className={`font-bold text-base flex-shrink-0 ${
                transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}