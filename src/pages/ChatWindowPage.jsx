import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockCreators, mockChats } from '../utils/mockData'

export default function ChatWindowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const creator = mockCreators.find(c => c.id === parseInt(id))
  const existingChat = mockChats.find(c => c.creatorId === parseInt(id))

  const [messages, setMessages] = useState(
    existingChat ? existingChat.messages : []
  )
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Creator not found</p>
      </div>
    )
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, message])
    setNewMessage('')

    // Simulate creator reply after 1 second
    setTimeout(() => {
      const reply = {
        id: messages.length + 2,
        sender: 'creator',
        text: 'Thanks for your message! I will get back to you shortly. 😊',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, reply])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center gap-3 shadow-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-white text-xl hover:opacity-75 transition"
        >
          ←
        </button>

        {/* Creator Info */}
        <div className="relative">
          <img
            src={creator.photo}
            alt={creator.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
          />
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${creator.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
        </div>

        <div className="flex-1">
          <h2 className="font-bold text-lg">{creator.name}</h2>
          <p className={`text-xs ${creator.isOnline ? 'text-green-300' : 'text-purple-200'}`}>
            {creator.isOnline ? '🟢 Online' : '⚫ Offline'}
          </p>
        </div>

        {/* Call Button */}
        <button
          onClick={() => navigate(`/call/${creator.id}`)}
          className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition"
        >
          📞
        </button>
        <button
          onClick={() => navigate(`/call/${creator.id}`)}
          className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition"
        >
          📹
        </button>
      </div>

      {/* Encryption Notice */}
      <div className="bg-yellow-50 text-yellow-700 text-xs text-center py-2 px-4">
        🔒 Messages are secure and end-to-end encrypted
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-500 font-semibold">Start a conversation</p>
            <p className="text-gray-400 text-sm mt-1">
              Chat rate: ₹{creator.chatRate}/message
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Creator Avatar */}
              {message.sender === 'creator' && (
                <img
                  src={creator.photo}
                  alt={creator.name}
                  className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                />
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-200' : 'text-gray-400'} text-right`}>
                  {message.time} {message.sender === 'user' && '✓✓'}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button type="button" className="text-gray-400 text-xl hover:text-gray-600">
            📎
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
          />
          <button type="button" className="text-gray-400 text-xl hover:text-gray-600">
            😊
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition disabled:opacity-50"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}