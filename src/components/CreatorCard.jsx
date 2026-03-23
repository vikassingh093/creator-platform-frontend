import { useNavigate } from 'react-router-dom'

export default function CreatorCard({ creator }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/creator/${creator.id}`)}
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img src={creator.photo} alt={creator.name} className="w-full h-full object-cover" />
        
        {/* Online Status */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${creator.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
          <div className={`w-2 h-2 rounded-full ${creator.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          {creator.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Creator Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800">{creator.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{creator.specialty}</p>
        
        {/* Rating */}
        <div className="flex items-center mb-3">
          <span className="text-yellow-400">⭐</span>
          <span className="font-semibold ml-1 text-sm">{creator.rating}</span>
          <span className="text-gray-400 text-xs ml-1">({creator.reviews} reviews)</span>
        </div>

        {/* Call Rate */}
        <div className="bg-purple-50 rounded-xl p-2 text-center mb-3">
          <p className="text-purple-600 font-bold text-lg">₹{creator.callRate}/min</p>
          <p className="text-gray-500 text-xs">Call Rate</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${creator.id}`) }}
            className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-semibold hover:bg-purple-700 transition text-sm"
          >
            💬 Chat
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/call/${creator.id}`) }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
          >
            📞 Call
          </button>
        </div>
      </div>
    </div>
  )
}