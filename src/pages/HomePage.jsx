import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { creatorsAPI } from '../api/creators'
import useAuthStore from '../store/authStore'
import BottomNav from '../components/BottomNav'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.user_type === 'creator') navigate('/creator-dashboard', { replace: true })
    if (user?.user_type === 'admin') navigate('/admin', { replace: true })
  }, [user])

  const [creators, setCreators] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await creatorsAPI.getCategories()
        // ✅ FIXED: prevent duplicate 'All' key
        const cats = data.categories || []
        const filtered = cats.filter(c => c !== 'All')
        setCategories(['All', ...filtered])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (selectedCategory !== 'All') params.category = selectedCategory
        if (search.trim()) params.search = search.trim()
        const data = await creatorsAPI.getCreators(params)
        setCreators(data.creators || [])
      } catch (err) {
        setError('Failed to load creators')
      } finally {
        setLoading(false)
      }
    }
    const debounce = setTimeout(fetchCreators, 400)
    return () => clearTimeout(debounce)
  }, [selectedCategory, search])

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24">

      {/* Header - Bumble Style */}
      <div className="bg-[#FFC629] px-4 pt-10 pb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[#1D1D1D] opacity-60 text-sm font-medium">Welcome back 👋</p>
            <h1 className="text-xl font-extrabold text-[#1D1D1D]">{user?.name}</h1>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-[#1D1D1D] text-[#FFC629] px-4 py-2 rounded-2xl text-sm font-bold shadow"
          >
            💰 Wallet
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl flex items-center px-4 py-3 shadow-sm">
          <span className="mr-2 text-[#757575]">🔍</span>
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[#1D1D1D] placeholder-[#AAAAAA] outline-none text-sm font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#757575] ml-2 font-bold">✕</button>
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
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border-2 ${
                selectedCategory === cat
                  ? 'bg-[#FFC629] text-[#1D1D1D] border-[#FFC629] shadow'
                  : 'bg-white text-[#757575] border-[#E0E0E0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Grid */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">😕</p>
            <p className="text-[#757575]">{error}</p>
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-[#FFA500] font-bold underline"
            >
              Try Again
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-[#757575]">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {creators.map(creator => (
              <button
                key={creator.id}
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-[#FFC629] overflow-hidden text-left transition"
              >
                {/* Photo */}
                <div className="relative">
                  <div className="w-full h-36 bg-[#FFF8E1] flex items-center justify-center text-[#FFA500] text-4xl font-extrabold">
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
                      ? 'bg-[#00C851] text-white'
                      : 'bg-[#AAAAAA] text-white'
                  }`}>
                    {creator.is_available ? '● Online' : '● Offline'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-extrabold text-[#1D1D1D] text-sm truncate">{creator.name}</h3>
                  <p className="text-[#FFA500] text-xs font-bold mt-0.5">{creator.category}</p>
                  <p className="text-[#AAAAAA] text-xs mt-1 line-clamp-2">{creator.bio || 'No bio available'}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[#FFC629] text-xs">⭐</span>
                    <span className="text-[#1D1D1D] text-xs font-bold">
                      {creator.rating ? Number(creator.rating).toFixed(1) : 'New'}
                    </span>
                    {creator.total_reviews > 0 && (
                      <span className="text-[#AAAAAA] text-xs">({creator.total_reviews})</span>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="mt-2">
                    <span className="bg-[#FFF8E1] text-[#FFA500] text-xs px-2 py-0.5 rounded-full font-bold border border-[#FFC629]">
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