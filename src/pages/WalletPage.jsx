import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletAPI } from '../api/wallet'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

export default function WalletPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    setLoading(true)
    try {
      const [walletData, txData] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions(),
      ])
      setWallet(walletData.wallet)
      setTransactions(txData.transactions)
    } catch (err) {
      console.error('Wallet fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 10) {
      alert('Minimum recharge is ₹10')
      return
    }
    if (amt > 10000) {
      alert('Maximum recharge is ₹10,000')
      return
    }

    setPaying(true)
    try {
      // Dummy payment ID for testing
      const dummyPaymentId = `pay_test_${Date.now()}`

      const data = await walletAPI.addMoney(amt, dummyPaymentId)
      setWallet(data.wallet)
      await fetchWalletData()
      setShowAddMoney(false)
      setAmount('')
      alert(`✅ ₹${amt} added to wallet successfully!`)
    } catch (err) {
      console.error('Wallet error:', err)
      alert(err.response?.data?.detail || 'Failed to add money. Try again.')
    } finally {
      setPaying(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true
    if (activeTab === 'credit') return tx.type === 'add_money'
    if (activeTab === 'debit') return ['chat', 'call', 'content', 'payout'].includes(tx.type)
    return true
  })

  const getTransactionIcon = (type) => {
    const icons = {
      add_money: '💰',
      chat: '💬',
      call: '📞',
      content: '📸',
      payout: '🏦',
    }
    return icons[type] || '💳'
  }

  const getTransactionColor = (type) => {
    return type === 'add_money'
      ? 'text-green-600'
      : 'text-red-500'
  }

  const getSign = (type) => {
    return type === 'add_money' ? '+' : '-'
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
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-16 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Wallet 💰</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-white bg-opacity-20 px-3 py-1 rounded-xl text-sm font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Balance Card - Overlapping */}
      <div className="mx-4 -mt-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-400 text-sm text-center">Available Balance</p>
          <p className="text-4xl font-bold text-center text-gray-800 mt-1">
            ₹{wallet ? Number(wallet.balance).toFixed(2) : '0.00'}
          </p>

          {/* Add Money Button */}
          <button
            onClick={() => setShowAddMoney(true)}
            className="w-full mt-5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            ➕ Add Money
          </button>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-green-600 font-bold text-lg">
                ₹{transactions
                  .filter(t => t.type === 'add_money')
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Total Added</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-red-500 font-bold text-lg">
                ₹{transactions
                  .filter(t => ['debit', 'chat', 'call', 'content', 'payout'].includes(t.type))
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mx-4 mt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Transaction History
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          {['all', 'credit', 'debit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {tab === 'all' ? '📋 All' : tab === 'credit' ? '💰 Added' : '💸 Spent'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            filteredTransactions.map((tx, index) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-4 ${
                  index !== filteredTransactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${getTransactionColor(tx.type)}`}>
                    {getSign(tx.type)}₹{Number(tx.amount).toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'success'
                      ? 'bg-green-100 text-green-600'
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">Add Money</h2>
              <button
                onClick={() => { setShowAddMoney(false); setAmount('') }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Amount Input */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-gray-400 text-xs mb-1">Enter Amount (₹)</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="10"
                  max="10000"
                  className="flex-1 text-3xl font-bold text-gray-800 bg-transparent outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Min ₹10 • Max ₹10,000</p>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`py-2.5 rounded-xl text-sm font-bold transition ${
                    amount === amt.toString()
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Pay Button */}
            <button
              onClick={handleAddMoney}
              disabled={paying || !amount}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? '⏳ Processing...' : `💳 Pay ₹${amount || '0'}`}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}