import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import StatsTab from './tabs/StatsTab'
import CreatorsTab from './tabs/CreatorsTab'
import UsersTab from './tabs/UsersTab'
import WithdrawalsTab from './tabs/WithdrawalsTab'
import TransactionsTab from './tabs/TransactionsTab'
import RefundTab from './tabs/RefundTab'
import OffersTab from './tabs/OffersTab'
import PhotoApprovalsTab from './tabs/PhotoApprovalsTab'

const TABS = [
  { key: 'stats', label: '📊 Stats', icon: '📊' },
  { key: 'creators', label: '🎨 Creators', icon: '🎨' },
  { key: 'photos', label: '📸 Photos', icon: '📸' },
  { key: 'users', label: '👥 Users', icon: '👥' },
  { key: 'transactions', label: '📋 Txns', icon: '📋' },
  { key: 'withdrawals', label: '💸 Payouts', icon: '💸' },
  { key: 'refund', label: '💰 Refund', icon: '💰' },
  { key: 'offers', label: '🎁 Offers', icon: '🎁' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('stats')

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'stats': return <StatsTab />
      case 'creators': return <CreatorsTab />
      case 'photos': return <PhotoApprovalsTab />
      case 'users': return <UsersTab />
      case 'transactions': return <TransactionsTab />
      case 'withdrawals': return <WithdrawalsTab />
      case 'refund': return <RefundTab />
      case 'offers': return <OffersTab />
      default: return <StatsTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white px-5 pt-12 pb-7">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚡ Admin Panel</h1>
            <p className="text-violet-200 text-xs mt-1 font-medium">Platform Control Center</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="bg-white/15 backdrop-blur px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/25 transition"
            >
              🏠
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/80 backdrop-blur px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500 transition"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 flex overflow-x-auto border-b border-gray-800 sticky top-0 z-20 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-3.5 text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/10'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {renderTab()}
      </div>
    </div>
  )
}