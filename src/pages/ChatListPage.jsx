import { useNavigate } from 'react-router-dom'
import { mockChats } from '../utils/mockData'
import BottomNav from '../components/BottomNav'

export default function ChatListPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold">My Chats 💬</h1>
        <p className="text-purple-200 text-sm">Your conversations with creators</p>
      </div>

      {/* Chat List */}
      <div className="p-4 space-y-3">
        {mockChats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-gray-500 font-semibold">No chats yet</p>
            <p className="text-gray-400 text-sm mt-1">Start chatting with a creator!</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl font-semibold"
            >
              Browse Creators
            </button>
          </div>
        ) : (
          mockChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.creatorId}`)}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition"
            >
              {/* Creator Photo */}
              <div className="relative">
                <img
                  src={chat.creatorPhoto}
                  alt={chat.creatorName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">{chat.creatorName}</h3>
                  <span className="text-xs text-gray-400">{chat.timestamp}</span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{chat.lastMessage}</p>
              </div>

              {/* Unread Badge */}
              {chat.unread > 0 && (
                <div className="bg-purple-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}