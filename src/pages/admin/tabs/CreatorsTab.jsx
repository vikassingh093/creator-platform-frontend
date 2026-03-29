import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function CreatorsTab() {
  const [creators, setCreators] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCreators() }, [filter])

  const fetchCreators = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/admin/creators?status=${filter}`)
      setCreators(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (creatorProfileId, action) => {
    try {
      await apiClient.put(`/admin/creators/${creatorProfileId}/approve`, { action })
      fetchCreators()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : creators.length === 0 ? (
        <EmptyState icon="🎨" message="No creators found" />
      ) : (
        creators.map(creator => (
          <div key={creator.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                {creator.profile_photo
                  ? <img src={creator.profile_photo} alt="" className="w-full h-full object-cover" />
                  : creator.name?.charAt(0)
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{creator.name}</p>
                <p className="text-[11px] text-gray-500">{creator.phone} • {creator.specialty}</p>
                <p className="text-[11px] text-gray-600 truncate">{creator.bio}</p>
              </div>
              <StatusBadge status={creator.is_approved ? 'approved' : creator.is_rejected ? 'rejected' : 'pending'} />
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-3 px-1">
              <div className="text-center">
                <p className="text-xs font-bold text-amber-400">{creator.rating ? Number(creator.rating).toFixed(1) : '0.0'}⭐</p>
                <p className="text-[9px] text-gray-600">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-300">{creator.total_reviews || 0}</p>
                <p className="text-[9px] text-gray-600">Reviews</p>
              </div>
            </div>

            {!creator.is_approved && !creator.is_rejected && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(creator.creator_profile_id, 'approve')}
                  className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-500/25 transition"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleAction(creator.creator_profile_id, 'reject')}
                  className="flex-1 bg-red-500/15 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-xl text-xs hover:bg-red-500/25 transition"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}