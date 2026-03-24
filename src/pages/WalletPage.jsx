import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletAPI } from '../api/wallet'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

// ── Load Razorpay script ────────────────────────────────
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

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
      setWallet(walletData.wallet || null)
      setTransactions(txData.transactions || [])
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
      // ── Step 1: Load Razorpay SDK ─────────────────────
      const loaded = await loadRazorpay()
      if (!loaded) {
        alert('Failed to load Razorpay. Check your internet connection.')
        setPaying(false)
        return
      }

      // ── Step 2: Create order from backend ─────────────
      const orderData = await walletAPI.createOrder(amt)

      // ── Step 3: Open Razorpay Checkout ────────────────
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount_paise,
        currency: 'INR',
        name: 'CreatorHub',
        description: `Wallet Recharge ₹${amt}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#db2777', // pink-600
        },
        handler: async (response) => {
          try {
            // ── Step 4: Verify payment on backend ────────
            const result = await walletAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            })
            setWallet(result.wallet)
            await fetchWalletData()
            setShowAddMoney(false)
            setAmount('')
            alert(`✅ ₹${amt} added to wallet successfully!`)
          } catch (err) {
            alert(err.response?.data?.detail || 'Payment verification failed!')
          } finally {
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
            alert('Payment cancelled.')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error('Payment error:', err)
      alert(err.response?.data?.detail || 'Failed to initiate payment. Try again.')
      setPaying(false)
    }
  }

  const filteredTransactions = (transactions || []).filter(tx => {
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

  const getTransactionColor = (type) => type === 'add_money' ? 'text-green-600' : 'text-red-500'
  const getSign = (type) => type === 'add_money' ? '+' : '-'

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

      {/* Balance Card */}
      <div className="mx-4 -mt-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-400 text-sm text-center">Available Balance</p>
          <p className="text-4xl font-bold text-center text-gray-800 mt-1">
            ₹{wallet ? Number(wallet.balance).toFixed(2) : '0.00'}
          </p>

          <button
            onClick={() => setShowAddMoney(true)}
            className="w-full mt-5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            ➕ Add Money via Razorpay
          </button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-green-600 font-bold text-lg">
                ₹{(transactions || [])
                  .filter(t => t.type === 'add_money')
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Total Added</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-red-500 font-bold text-lg">
                ₹{(transactions || [])
                  .filter(t => ['chat', 'call', 'content', 'payout'].includes(t.type))
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
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${getTransactionColor(tx.type)}`}>
                    {getSign(tx.type)}₹{Number(tx.amount).toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'success' ? 'bg-green-100 text-green-600' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-500'
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

            {/* Razorpay Pay Button */}
            <button
              onClick={handleAddMoney}
              disabled={paying || !amount}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>💳 Pay ₹{amount || '0'} via Razorpay</>
              )}
            </button>

            {/* Razorpay Badge */}
            <p className="text-center text-xs text-gray-400 mt-3">
              🔒 Secured by Razorpay
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}