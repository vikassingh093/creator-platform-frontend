import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { creatorsAPI } from '../api/creators'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    // Redirect creator to their dashboard
    if (user?.user_type === 'creator') {
      navigate('/creator-dashboard', { replace: true })
    }
    if (user?.user_type === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user])

  const [creators, setCreators] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await creatorsAPI.getCategories()
        setCategories(['All', ...(data.categories || [])])  // ✅ fallback
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  // Fetch creators on filter change
  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (selectedCategory !== 'All') params.category = selectedCategory
        if (search.trim()) params.search = search.trim()

        const data = await creatorsAPI.getCreators(params)
        setCreators(data.creators || [])  // ✅ fallback to empty array
      } catch (err) {
        setError('Failed to load creators')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchCreators, 400)
    return () => clearTimeout(debounce)
  }, [selectedCategory, search])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-pink-200 text-sm">Welcome back 👋</p>
            <h1 className="text-xl font-bold">{user?.name}</h1>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-white bg-opacity-20 px-3 py-2 rounded-xl text-sm font-semibold"
          >
            💰 Wallet
          </button>
        </div>

        {/* Search */}
        <div className="bg-white bg-opacity-20 rounded-2xl flex items-center px-4 py-3">
          <span className="mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-pink-200 outline-none text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-pink-200 ml-2">✕</button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Creators List */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">😕</p>
            <p className="text-gray-500">{error}</p>
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-pink-600 font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-gray-500">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(creators || []).map(creator => (
              <button
                key={creator.id}
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition"
              >
                {/* Photo */}
                <div className="relative">
                  <div className="w-full h-36 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                    {creator.profile_photo ? (
                      <img
                        src={creator.profile_photo}
                        alt={creator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      creator.name?.charAt(0)
                    )}
                  </div>
                  {/* Online Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    creator.is_available
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {creator.is_available ? '🟢 Online' : '⚫ Offline'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{creator.name}</h3>
                  <p className="text-pink-600 text-xs font-medium mt-0.5">{creator.category}</p>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{creator.bio || 'No bio available'}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-gray-600 text-xs font-semibold">
                      {creator.rating ? Number(creator.rating).toFixed(1) : 'New'}
                    </span>
                    {creator.total_reviews > 0 && (
                      <span className="text-gray-400 text-xs">({creator.total_reviews})</span>
                    )}
                  </div>

                  {/* Rates */}
                  <div className="flex gap-2 mt-2">
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                      💬 ₹{creator.chat_rate}/min
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}