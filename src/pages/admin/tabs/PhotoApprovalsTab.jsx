import { useState, useEffect } from 'react'
import apiClient from '../../../api/client'
import { getPhotoUrl } from '../../../utils/photoUrl'

export default function PhotoApprovalsTab() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState(null)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { fetchPhotos() }, [filter])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/admin/photo-approvals?status=${filter}`)
      setPhotos(res.data.data || [])
    } catch (err) {
      console.error('Photo approvals error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    if (!confirm('Approve this photo?')) return
    setProcessing(userId)
    try {
      await apiClient.put(`/admin/photo-approvals/${userId}`, { action: 'approve' })
      fetchPhotos()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (userId) => {
    setProcessing(userId)
    try {
      await apiClient.put(`/admin/photo-approvals/${userId}`, {
        action: 'reject',
        reason: rejectReason || 'Photo not appropriate'
      })
      setRejectId(null)
      setRejectReason('')
      fetchPhotos()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    } finally {
      setProcessing(null)
    }
  }

  const pendingCount = photos.filter(p => p.photo_status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">
          📸 Photo Approvals
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </h2>
        <button onClick={fetchPhotos} className="text-violet-400 text-xs font-bold">🔄 Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === f
                ? 'bg-violet-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f === 'pending' ? '⏳' : f === 'approved' ? '✅' : f === 'rejected' ? '❌' : '📋'} {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-16 bg-gray-900 rounded-2xl">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-gray-500 font-bold">No {filter} photos</p>
        </div>
      )}

      {/* Photo cards */}
      {!loading && photos.map(photo => (
        <div key={photo.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          {/* Creator info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold overflow-hidden">
              {photo.profile_photo ? (
                <img src={getPhotoUrl(photo.profile_photo)} alt="" className="w-full h-full object-cover" />
              ) : (
                photo.name?.charAt(0) || '?'
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{photo.name}</p>
              <p className="text-gray-500 text-xs">{photo.phone} • {photo.specialty}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              photo.photo_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              photo.photo_status === 'approved' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {photo.photo_status?.toUpperCase()}
            </span>
          </div>

          {/* Photo comparison: Current → New */}
          <div className="flex items-center justify-center gap-4 bg-gray-950 rounded-xl p-4 mb-4">
            {/* Current photo */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 border-2 border-gray-700 mx-auto">
                {photo.profile_photo ? (
                  <img src={getPhotoUrl(photo.profile_photo)} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                    {photo.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-bold">Current</p>
            </div>

            <span className="text-violet-400 text-xl">→</span>

            {/* New/Pending photo */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 border-2 border-violet-500 mx-auto shadow-lg shadow-violet-500/20">
                {photo.pending_photo ? (
                  <img src={getPhotoUrl(photo.pending_photo)} alt="New" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">N/A</div>
                )}
              </div>
              <p className="text-[10px] text-violet-400 mt-1 font-bold">New Upload</p>
            </div>
          </div>

          {/* Reject reason if already rejected */}
          {photo.photo_status === 'rejected' && photo.photo_reject_reason && (
            <div className="bg-red-500/10 rounded-xl p-3 mb-3">
              <p className="text-xs text-red-400">❌ Rejected: {photo.photo_reject_reason}</p>
            </div>
          )}

          {/* Action buttons — only for pending */}
          {photo.photo_status === 'pending' && (
            <>
              {rejectId === photo.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRejectId(null); setRejectReason('') }}
                      className="flex-1 bg-gray-800 text-gray-400 text-xs font-bold py-2.5 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(photo.id)}
                      disabled={processing === photo.id}
                      className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {processing === photo.id ? 'Rejecting...' : '❌ Confirm Reject'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(photo.id)}
                    disabled={processing === photo.id}
                    className="flex-1 bg-green-500 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition"
                  >
                    {processing === photo.id ? 'Approving...' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => setRejectId(photo.id)}
                    className="flex-1 bg-red-500/20 text-red-400 text-xs font-bold py-3 rounded-xl active:scale-95 transition"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}