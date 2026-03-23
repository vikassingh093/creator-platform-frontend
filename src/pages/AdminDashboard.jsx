import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [creators, setCreators] = useState([
    {
      id: 1,
      name: 'Riya Sharma',
      specialty: 'Fitness Trainer',
      email: 'riya@example.com',
      phone: '9876543210',
      status: 'approved',
      joinDate: '10 Jan 2025',
      earnings: '₹12,450',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    },
    {
      id: 2,
      name: 'Arjun Mehta',
      specialty: 'Motivational Speaker',
      email: 'arjun@example.com',
      phone: '9876543211',
      status: 'approved',
      joinDate: '15 Jan 2025',
      earnings: '₹8,200',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    },
    {
      id: 3,
      name: 'Pooja Verma',
      specialty: 'Dance Coach',
      email: 'pooja@example.com',
      phone: '9876543212',
      status: 'pending',
      joinDate: '20 Mar 2025',
      earnings: '₹0',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    },
    {
      id: 4,
      name: 'Rohan Das',
      specialty: 'Music Producer',
      email: 'rohan@example.com',
      phone: '9876543213',
      status: 'pending',
      joinDate: '22 Mar 2025',
      earnings: '₹0',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    },
    {
      id: 5,
      name: 'Sneha Kapoor',
      specialty: 'Nutritionist',
      email: 'sneha@example.com',
      phone: '9876543214',
      status: 'rejected',
      joinDate: '18 Mar 2025',
      earnings: '₹0',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    },
  ])

  const [users] = useState([
    { id: 1, name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543210', wallet: '₹1,250', joined: '5 Jan 2025', status: 'active' },
    { id: 2, name: 'Priya Singh', email: 'priya@example.com', phone: '9876543215', wallet: '₹500', joined: '8 Jan 2025', status: 'active' },
    { id: 3, name: 'Amit Kumar', email: 'amit@example.com', phone: '9876543216', wallet: '₹2,000', joined: '12 Jan 2025', status: 'active' },
    { id: 4, name: 'Meera Joshi', email: 'meera@example.com', phone: '9876543217', wallet: '₹750', joined: '20 Jan 2025', status: 'blocked' },
  ])

  const [selectedCreator, setSelectedCreator] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const stats = [
    { icon: '👥', label: 'Total Users', value: users.length, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: '🎨', label: 'Total Creators', value: creators.length, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: '⏳', label: 'Pending Approvals', value: creators.filter(c => c.status === 'pending').length, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: '💰', label: 'Platform Revenue', value: '₹24,500', color: 'text-green-500', bg: 'bg-green-50' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'creators', label: 'Creators', icon: '🎨' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'payouts', label: 'Payouts', icon: '💸' },
  ]

  const handleApprove = (creatorId) => {
    setCreators(prev =>
      prev.map(c => c.id === creatorId ? { ...c, status: 'approved' } : c)
    )
    setShowDetailModal(false)
    alert('✅ Creator approved successfully!')
  }

  const handleReject = (creatorId) => {
    setCreators(prev =>
      prev.map(c => c.id === creatorId ? { ...c, status: 'rejected' } : c)
    )
    setShowDetailModal(false)
    alert('❌ Creator rejected!')
  }

  const filteredCreators = creators.filter(c => {
    if (filterStatus === 'all') return true
    return c.status === filterStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">✅ Approved</span>
      case 'pending':
        return <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">⏳ Pending</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">❌ Rejected</span>
      default:
        return null
    }
  }

  const payouts = [
    { id: 1, creator: 'Riya Sharma', amount: '₹8,750', requestDate: 'Today', status: 'pending', upi: 'riya@upi' },
    { id: 2, creator: 'Arjun Mehta', amount: '₹5,200', requestDate: 'Yesterday', status: 'pending', upi: 'arjun@upi' },
    { id: 3, creator: 'Kabir Patel', amount: '₹3,100', requestDate: '20 Mar', status: 'paid', upi: 'kabir@upi' },
    { id: 4, creator: 'Neha Singh', amount: '₹2,400', requestDate: '18 Mar', status: 'paid', upi: 'neha@upi' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 pt-10 pb-6 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard ⚙️</h1>
            <p className="text-gray-400 text-sm">Manage your platform</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-white bg-opacity-10 px-3 py-1 rounded-xl text-sm font-semibold hover:bg-opacity-20 transition"
          >
            🚪 Exit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center text-xl mb-3`}>
                    {stat.icon}
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Pending Approvals */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-gray-800 text-lg">Pending Approvals</h2>
                <button
                  onClick={() => setActiveTab('creators')}
                  className="text-purple-600 text-sm font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {creators.filter(c => c.status === 'pending').map(creator => (
                  <div
                    key={creator.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={creator.photo}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800">{creator.name}</p>
                        <p className="text-gray-500 text-xs">{creator.specialty}</p>
                        <p className="text-gray-400 text-xs">Joined: {creator.joinDate}</p>
                      </div>
                      {getStatusBadge(creator.status)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(creator.id)}
                        className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-green-600 transition"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReject(creator.id)}
                        className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-red-600 transition"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCreator(creator)
                          setShowDetailModal(true)
                        }}
                        className="px-3 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-sm hover:bg-gray-200 transition"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
                {creators.filter(c => c.status === 'pending').length === 0 && (
                  <div className="text-center py-8 bg-white rounded-2xl">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-gray-500 font-semibold">No pending approvals!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">Revenue This Month</h3>
              <div className="flex items-end gap-2 h-24">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-gray-400 text-xs">Jan</p>
                <p className="text-gray-400 text-xs">Dec</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATORS TAB */}
        {activeTab === 'creators' && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap capitalize transition ${
                    filterStatus === status
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status} ({status === 'all' ? creators.length : creators.filter(c => c.status === status).length})
                </button>
              ))}
            </div>

            {/* Creator List */}
            <div className="space-y-3">
              {filteredCreators.map(creator => (
                <div key={creator.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={creator.photo}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{creator.name}</p>
                      <p className="text-gray-500 text-xs">{creator.specialty}</p>
                      <p className="text-gray-400 text-xs">{creator.email}</p>
                    </div>
                    {getStatusBadge(creator.status)}
                  </div>

                  <div className="flex gap-2">
                    {creator.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(creator.id)}
                          className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-green-600 transition"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(creator.id)}
                          className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-red-600 transition"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {creator.status === 'approved' && (
                      <button
                        onClick={() => handleReject(creator.id)}
                        className="flex-1 bg-red-50 text-red-500 border border-red-200 font-bold py-2 rounded-xl text-sm hover:bg-red-100 transition"
                      >
                        🚫 Suspend
                      </button>
                    )}
                    {creator.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(creator.id)}
                        className="flex-1 bg-green-50 text-green-500 border border-green-200 font-bold py-2 rounded-xl text-sm hover:bg-green-100 transition"
                      >
                        ✅ Re-approve
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCreator(creator)
                        setShowDetailModal(true)
                      }}
                      className="px-4 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-sm hover:bg-gray-200 transition"
                    >
                      👁️ View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg">All Users ({users.length})</h2>
            </div>
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-800">{user.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {user.status === 'active' ? '✅ Active' : '🚫 Blocked'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-gray-400 text-xs">📱 {user.phone}</p>
                      <p className="text-purple-600 text-xs font-semibold">💰 {user.wallet}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2 rounded-xl text-xs hover:bg-gray-200 transition">
                    👁️ View Details
                  </button>
                  <button className={`flex-1 font-semibold py-2 rounded-xl text-xs transition ${
                    user.status === 'active'
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-green-50 text-green-500 hover:bg-green-100'
                  }`}>
                    {user.status === 'active' ? '🚫 Block' : '✅ Unblock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-orange-500">
                  ₹{payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseInt(p.amount.replace('₹', '').replace(',', '')), 0).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs mt-1">Pending Payouts</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-green-500">
                  ₹{payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseInt(p.amount.replace('₹', '').replace(',', '')), 0).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs mt-1">Paid Out</p>
              </div>
            </div>

            <h2 className="font-bold text-gray-800 text-lg">Payout Requests</h2>
            <div className="space-y-3">
              {payouts.map(payout => (
                <div key={payout.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{payout.creator}</p>
                      <p className="text-gray-400 text-xs">{payout.upi}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Requested: {payout.requestDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">{payout.amount}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        payout.status === 'pending'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {payout.status === 'pending' ? '⏳ Pending' : '✅ Paid'}
                      </span>
                    </div>
                  </div>
                  {payout.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-green-600 transition">
                        💸 Pay Now
                      </button>
                      <button className="flex-1 bg-red-50 text-red-500 border border-red-200 font-bold py-2 rounded-xl text-sm hover:bg-red-100 transition">
                        ❌ Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creator Detail Modal */}
      {showDetailModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Creator Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {/* Creator Profile */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedCreator.photo}
                  alt={selectedCreator.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-100"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedCreator.name}</h3>
                  <p className="text-gray-500">{selectedCreator.specialty}</p>
                  {getStatusBadge(selectedCreator.status)}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {[
                  { label: 'Email', value: selectedCreator.email, icon: '📧' },
                  { label: 'Phone', value: selectedCreator.phone, icon: '📱' },
                  { label: 'Join Date', value: selectedCreator.joinDate, icon: '📅' },
                  { label: 'Total Earnings', value: selectedCreator.earnings, icon: '💰' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-gray-400 text-xs">{item.label}</p>
                      <p className="text-gray-800 font-semibold text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            {selectedCreator.status === 'pending' && (
              <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
                <button
                  onClick={() => handleApprove(selectedCreator.id)}
                  className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleReject(selectedCreator.id)}
                  className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}