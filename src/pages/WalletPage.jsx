import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletAPI } from '../api/wallet'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

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
    if (!amt || amt < 10) { alert('Minimum recharge is ₹10'); return }
    if (amt > 10000) { alert('Maximum recharge is ₹10,000'); return }

    setPaying(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        alert('Failed to load Razorpay. Check your internet connection.')
        setPaying(false)
        return
      }

      const orderData = await walletAPI.createOrder(amt)

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount_paise,
        currency: 'INR',
        name: 'CreatorHub',
        description: `Wallet Recharge ₹${amt}`,
        order_id: orderData.order_id,
        prefill: { name: user?.name || '', contact: user?.phone || '' },
        theme: { color: '#FFC629' },
        handler: async (response) => {
          try {
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
      alert(err.response?.data?.detail || 'Failed to initiate payment. Try again.')
      setPaying(false)
    }
  }

  // ✅ Backend uses type: "add_money" for credits, bonus types are also credits
  const CREDIT_TYPES = ['add_money', 'signup_bonus', 'first_deposit_bonus', 'event_bonus', 'promo_bonus', 'refund', 'adjustment']
  const isCredit = (tx) => CREDIT_TYPES.includes(tx.type)

  const filteredTransactions = (transactions || []).filter(tx => {
    if (activeTab === 'all') return true
    if (activeTab === 'credit') return tx.type === 'add_money'
    if (activeTab === 'debit') return tx.type !== 'add_money'
    return true
  })

  const getTransactionIcon = (tx) => {
    const type = tx.type || ''
    if (type.includes('bonus') || type.includes('promo')) return '🎁'
    const desc = (tx.description || '').toLowerCase()
    if (desc.includes('call') || desc.includes('audio') || desc.includes('video')) return '📞'
    if (desc.includes('chat')) return '💬'
    if (desc.includes('recharge') || desc.includes('wallet')) return '💰'
    if (desc.includes('content')) return '📸'
    return '💳'
  }

  const getTransactionColor = (tx) =>
    isCredit(tx) ? 'text-[#00C851]' : 'text-red-500'

  const getSign = (tx) =>
    isCredit(tx) ? '+' : '-'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24">

      {/* Header */}
      <div className="bg-[#FFC629] px-4 pt-10 pb-16 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#1D1D1D]">My Wallet 💰</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#1D1D1D] text-[#FFC629] font-extrabold px-4 py-2 rounded-2xl text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 -mt-10">
        <div className="bg-white rounded-3xl shadow-sm border border-[#F0F0F0] p-6">
          <p className="text-[#AAAAAA] text-sm text-center">Available Balance</p>
          <p className="text-4xl font-extrabold text-center text-[#1D1D1D] mt-1">
            ₹{wallet ? Number(wallet.balance).toFixed(2) : '0.00'}
          </p>

          <button
            onClick={() => setShowAddMoney(true)}
            className="w-full mt-5 bg-[#FFC629] text-[#1D1D1D] font-extrabold py-4 rounded-2xl shadow flex items-center justify-center gap-2"
          >
            ➕ Add Money via Razorpay
          </button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#F8F8F8] rounded-2xl p-3 text-center border border-[#F0F0F0]">
              <p className="text-[#00C851] font-extrabold text-lg">
                ₹{(transactions || [])
                  .filter(t => isCredit(t))
                  .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
                  .toFixed(2)}
              </p>
              <p className="text-[#AAAAAA] text-xs mt-0.5">Total Added</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-2xl p-3 text-center border border-[#F0F0F0]">
              <p className="text-red-500 font-extrabold text-lg">
                ₹{(transactions || [])
                  .filter(t => !isCredit(t))
                  .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
                  .toFixed(2)}
              </p>
              <p className="text-[#AAAAAA] text-xs mt-0.5">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mx-4 mt-4">
        <p className="text-xs font-extrabold text-[#AAAAAA] uppercase tracking-wider mb-2 px-1">
          Transaction History
        </p>

        <div className="flex gap-2 mb-3">
          {['all', 'credit', 'debit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold capitalize transition ${
                activeTab === tab
                  ? 'bg-[#FFC629] text-[#1D1D1D]'
                  : 'bg-white text-[#AAAAAA] border-2 border-[#F0F0F0]'
              }`}
            >
              {tab === 'all' ? '📋 All' : tab === 'credit' ? '💰 Added' : '💸 Spent'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-[#AAAAAA] text-sm">No transactions yet</p>
            </div>
          ) : (
            filteredTransactions.map((tx, index) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-4 ${
                  index !== filteredTransactions.length - 1 ? 'border-b border-[#F0F0F0]' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center text-xl flex-shrink-0">
                  {getTransactionIcon(tx)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-[#1D1D1D] truncate">{tx.description}</p>
                  <p className="text-xs text-[#AAAAAA] mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold text-sm ${getTransactionColor(tx)}`}>
                    {getSign(tx)}₹{Math.abs(Number(tx.amount)).toFixed(2)}  {/* ✅ always positive display */}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                    tx.status === 'success'
                      ? 'bg-[#00C851] bg-opacity-10 text-[#00C851]'
                      : tx.status === 'pending'
                      ? 'bg-[#FFF8E1] text-[#FFA500]'
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
            <div className="w-12 h-1 bg-[#F0F0F0] rounded-full mx-auto mb-4"></div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold text-[#1D1D1D]">Add Money</h2>
              <button
                onClick={() => { setShowAddMoney(false); setAmount('') }}
                className="w-8 h-8 bg-[#F8F8F8] rounded-full flex items-center justify-center text-[#757575] font-extrabold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8F8F8] rounded-2xl p-4 mb-4 border-2 border-transparent focus-within:border-[#FFC629] transition">
              <p className="text-[#AAAAAA] text-xs mb-1">Enter Amount (₹)</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-[#AAAAAA]">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="10"
                  max="10000"
                  className="flex-1 text-3xl font-extrabold text-[#1D1D1D] bg-transparent outline-none"
                />
              </div>
              <p className="text-xs text-[#AAAAAA] mt-1">Min ₹10 • Max ₹10,000</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`py-2.5 rounded-xl text-sm font-extrabold transition ${
                    amount === amt.toString()
                      ? 'bg-[#FFC629] text-[#1D1D1D]'
                      : 'bg-[#F8F8F8] text-[#757575]'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddMoney}
              disabled={paying || !amount}
              className="w-full bg-[#FFC629] text-[#1D1D1D] font-extrabold py-4 rounded-2xl shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1D1D1D] border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>💳 Pay ₹{amount || '0'} via Razorpay</>
              )}
            </button>

            <p className="text-center text-xs text-[#AAAAAA] mt-3">
              🔒 Secured by Razorpay
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}