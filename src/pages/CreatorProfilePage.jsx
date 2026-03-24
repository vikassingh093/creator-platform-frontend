import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { creatorsAPI } from '../api/creators'
import useAuthStore from '../store/authStore'
import CallModal from '../components/call/CallModal'

export default function CreatorProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [creator, setCreator] = useState(null)
  const [reviews, setReviews] = useState([])
  const [content, setContent] = useState([])
  const [activeTab, setActiveTab] = useState('about')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCallModal, setShowCallModal] = useState(false)

  const { user } = useAuthStore()
  const isCreator = user?.user_type === 'creator'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [creatorData, reviewsData, contentData] = await Promise.all([
          creatorsAPI.getCreator(id),
          creatorsAPI.getCreatorReviews(id),
          creatorsAPI.getCreatorContent(id),
        ])
        setCreator(creatorData.creator)
        setReviews(reviewsData.reviews)
        setContent(contentData.content)
      } catch (err) {
        setError('Failed to load creator profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-5xl mb-3">😕</p>
        <p className="text-gray-500">{error || 'Creator not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-pink-600 font-semibold">
          Go Back
        </button>
      </div>
    )
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  const handleStartChat = async () => {
    try {
      // Check wallet first
      const walletData = await import('../api/wallet').then(m => m.walletAPI.getWallet())
      const balance = Number(walletData.wallet.balance)
      const rate = Number(creator.chat_rate)

      if (balance < rate) {
        if (window.confirm(`Insufficient balance! You need ₹${rate} to start chat. Add money now?`)) {
          navigate('/wallet')
        }
        return
      }

      navigate(`/chat/${creator.id}`)
    } catch (err) {
      navigate(`/chat/${creator.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Photo */}
      <div className="relative">
        <div className="w-full h-72 bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden">
          {creator.profile_photo ? (
            <img
              src={creator.profile_photo}
              alt={creator.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-7xl font-bold">
              {creator.name?.charAt(0)}
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-4 w-10 h-10 bg-black bg-opacity-40 rounded-full flex items-center justify-center text-white"
        >
          ←
        </button>

        {/* Online Badge */}
        <div className={`absolute top-10 right-4 px-3 py-1 rounded-full text-xs font-bold ${
          creator.is_available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          {creator.is_available ? '🟢 Online' : '⚫ Offline'}
        </div>

        {/* Creator Name on Photo */}
        <div className="absolute bottom-4 left-4">
          <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
          <p className="text-pink-300 text-sm font-medium">{creator.category}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white grid grid-cols-3 py-4 border-b border-gray-100">
        <div className="text-center border-r border-gray-100">
          <p className="text-lg font-bold text-gray-800">
            {creator.rating ? Number(creator.rating).toFixed(1) : '0.0'}
          </p>
          <div className="flex justify-center text-sm">
            {renderStars(creator.rating || 0)}
          </div>
          <p className="text-gray-400 text-xs mt-0.5">Rating</p>
        </div>
        <div className="text-center border-r border-gray-100">
          <p className="text-lg font-bold text-gray-800">{creator.total_reviews || 0}</p>
          <p className="text-gray-400 text-xs mt-0.5">Reviews</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">{content.length}</p>
          <p className="text-gray-400 text-xs mt-0.5">Posts</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white px-4 py-4 flex gap-3 border-b border-gray-100">
        {!isCreator && (
          <>
            <button
              onClick={handleStartChat}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              💬 Chat ₹{creator.chat_rate}/min
            </button>
            <button
              onClick={() => setShowCallModal(true)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              📞 Call ₹{creator.call_rate}/min
            </button>
          </>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <CallModal
          creator={creator}
          onClose={() => setShowCallModal(false)}
        />
      )}

      {/* Tabs */}
      <div className="bg-white flex border-b border-gray-100 sticky top-0 z-10">
        {['about', 'content', 'reviews'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-400'
            }`}
          >
            {tab === 'about' ? '👤 About' : tab === 'content' ? '📸 Content' : '⭐ Reviews'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 pb-24">

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">📝 Bio</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {creator.bio || 'No bio available'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">💰 Rates</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">💬</span>
                    <span className="text-gray-600 text-sm">Chat Rate</span>
                  </div>
                  <span className="font-bold text-pink-600">₹{creator.chat_rate}/min</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">📞</span>
                    <span className="text-gray-600 text-sm">Call Rate</span>
                  </div>
                  <span className="font-bold text-purple-600">₹{creator.call_rate}/min</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">🏷️ Category</h3>
              <span className="bg-pink-100 text-pink-600 font-semibold text-sm px-3 py-1.5 rounded-full">
                {creator.category}
              </span>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            {content.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">📭</p>
                <p className="text-gray-400">No content posted yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {content.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="w-full h-36 bg-gradient-to-br from-pink-200 to-purple-200 overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {item.content_type === 'video' ? '🎥' : '🖼️'}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-700 truncate">{item.title}</p>
                      <p className="text-xs text-pink-600 font-bold mt-0.5">
                        {item.is_free ? '🆓 Free' : `₹${item.price}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">💬</p>
                <p className="text-gray-400">No reviews yet</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {review.user_photo ? (
                        <img src={review.user_photo} alt={review.user_name} className="w-full h-full object-cover" />
                      ) : (
                        review.user_name?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{review.user_name}</p>
                      <div className="flex text-xs">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {new Date(review.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm">{review.review}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}