import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { chatAPI } from '../api/chat'
import useAuthStore from '../store/authStore'

export default function ChatPage() {
  const { creatorId } = useParams()
  const navigate = useNavigate()
  const { user, access_token } = useAuthStore()

  // Check if current user is a creator
  const isCreator = user?.user_type === 'creator'

  const [messages, setMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [creator, setCreator] = useState(null)
  const [balance, setBalance] = useState(0)
  const [chatRate, setChatRate] = useState(0)
  const [status, setStatus] = useState('connecting') // connecting, connected, ended
  const [error, setError] = useState('')
  const [lowBalance, setLowBalance] = useState(false)
  const [timer, setTimer] = useState(0)

  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    initChat()
    return () => cleanup()
  }, [creatorId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Timer
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [status])

  const initChat = async () => {
    try {
      setStatus('connecting')

      let roomData

      if (isCreator) {
        // Creator joins their own active room - use room_id from URL query param
        const params = new URLSearchParams(window.location.search)
        const roomIdParam = params.get('roomId')

        if (!roomIdParam) {
          setError('No active chat room found')
          setStatus('ended')
          return
        }

        // Get messages directly
        const msgData = await chatAPI.getMessages(roomIdParam)
        setRoomId(parseInt(roomIdParam))
        setMessages(msgData.messages || [])

        // Set dummy creator info as self
        setCreator({ name: 'Customer', profile_photo: null })
        setChatRate(0)

        connectWebSocket(parseInt(roomIdParam))
        return
      }

      // Normal user flow
      roomData = await chatAPI.startChat(creatorId)
      setRoomId(roomData.room_id)
      setCreator(roomData.creator)
      setChatRate(roomData.creator.chat_rate)

      const msgData = await chatAPI.getMessages(roomData.room_id)
      setMessages(msgData.messages || [])

      // Get wallet balance
      const walletData = await import('../api/wallet').then(m => m.walletAPI.getWallet())
      setBalance(Number(walletData.wallet.balance))

      connectWebSocket(roomData.room_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start chat')
      setStatus('ended')
    }
  }

  const connectWebSocket = (rid) => {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/ws/${rid}`)
    wsRef.current = ws

    ws.onopen = () => {
      // Send auth token
      ws.send(JSON.stringify({ token: access_token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWsMessage(data)
    }

    ws.onclose = () => {
      if (status !== 'ended') {
        setStatus('ended')
      }
    }

    ws.onerror = (err) => {
      console.error('WS error:', err)
      setError('Connection lost')
      setStatus('ended')
    }
  }

  const handleWsMessage = (data) => {
    switch (data.type) {
      case 'connected':
        setStatus('connected')
        setChatRate(data.chat_rate)
        break

      case 'message':
        setMessages(prev => [...prev, data])
        break

      case 'balance_update':
        setBalance(data.balance)
        setLowBalance(false)
        break

      case 'low_balance':
        setBalance(data.balance)
        setLowBalance(true)
        break

      case 'chat_ended':
        setStatus('ended')
        setError(data.message)
        clearInterval(timerRef.current)
        break

      case 'user_joined':
      case 'user_left':
        // Could show system message
        break

      case 'error':
        setError(data.message)
        setStatus('ended')
        break

      default:
        break
    }
  }

  const sendMessage = () => {
    if (!inputMsg.trim() || status !== 'connected') return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'message',
      message: inputMsg.trim()
    }))
    setInputMsg('')
  }

  const handleEndChat = async () => {
    if (!window.confirm('Are you sure you want to end the chat?')) return
    try {
      if (roomId) await chatAPI.endChat(roomId)
    } catch (err) {
      console.error('End chat error:', err)
    } finally {
      cleanup()
      setStatus('ended')
      setError('Chat ended by you')
    }
  }

  const cleanup = () => {
    clearInterval(timerRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null // prevent onclose from triggering status change
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Ended Screen ──────────────────────────────────────
  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center w-full max-w-sm">
          <p className="text-6xl mb-4">👋</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chat Ended</h2>
          <p className="text-gray-400 text-sm mb-2">{error || 'The chat session has ended'}</p>
          <p className="text-gray-400 text-sm mb-6">
            Duration: <span className="font-bold text-pink-600">{formatTime(timer)}</span>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/creator/${creatorId}`)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-2xl"
            >
              View Profile
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Connecting Screen ─────────────────────────────────
  if (status === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Connecting to chat...</p>
      </div>
    )
  }

  // ─── Chat Screen ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
        >
          ←
        </button>

        {/* Creator Info */}
        <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 overflow-hidden flex-shrink-0">
          {creator?.profile_photo ? (
            <img src={creator.profile_photo} alt={creator.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {creator?.name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-bold text-sm">{creator?.name}</p>
          <p className="text-pink-200 text-xs">
            ₹{chatRate}/min • {formatTime(timer)}
          </p>
        </div>

        {/* Balance */}
        <div className={`text-right ${lowBalance ? 'text-yellow-300' : 'text-white'}`}>
          <p className="text-xs font-bold">₹{Number(balance).toFixed(2)}</p>
          <p className="text-xs opacity-70">Balance</p>
        </div>

        {/* End Chat */}
        <button
          onClick={handleEndChat}
          className="bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
        >
          End
        </button>
      </div>

      {/* Low Balance Warning */}
      {lowBalance && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
          <p className="text-yellow-700 text-xs font-semibold">
            ⚠️ Low balance! Add money to continue chatting
          </p>
          <button
            onClick={() => navigate('/wallet')}
            className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-bold"
          >
            Add Money
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">👋</p>
            <p className="text-gray-400 text-sm">Say hello to {creator?.name}!</p>
            <p className="text-gray-300 text-xs mt-1">₹{chatRate} will be charged per minute</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar for others */}
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">
                  {msg.sender_photo ? (
                    <img src={msg.sender_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    msg.sender_name?.charAt(0)
                  )}
                </div>
              )}

              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {msg.message}
                </div>
                <p className="text-xs text-gray-400 mt-1 px-1">
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'now'
                  }
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none text-gray-800"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMsg.trim()}
          className="w-11 h-11 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  )
}