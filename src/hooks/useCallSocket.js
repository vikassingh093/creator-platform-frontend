/**
 * 🔌 WebSocket hook for incoming calls
 * 
 * USAGE:
 *   const { incomingCall, clearCall } = useCallSocket()
 * 
 * This replaces the polling useEffect in HomePage.jsx
 * Only active when VITE_USE_WEBSOCKET=true in .env
 * Falls back to polling automatically if WebSocket fails
 */

import { useState, useEffect, useRef } from 'react'
import useAuthStore from '../store/authStore'
import apiClient from '../api/client'

// ✅ Feature flag — set in .env to switch between polling and websocket
const USE_WEBSOCKET = import.meta.env.VITE_USE_WEBSOCKET === 'true'

export default function useCallSocket() {
  const { user, token } = useAuthStore()
  const [incomingCall, setIncomingCall] = useState(null)
  const socketRef = useRef(null)
  const pollingRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return

    // ────────────────────────────────────────────
    // MODE 1: WebSocket (instant, no polling)
    // ────────────────────────────────────────────
    if (USE_WEBSOCKET) {
      let socket = null

      const connectSocket = async () => {
        try {
          // Dynamic import — only loads socket.io if needed
          const { io } = await import('socket.io-client')

          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

          socket = io(baseUrl, {
            path: '/ws/socket.io',
            auth: { token: token },         // ✅ Send JWT for auth
            transports: ['websocket'],       // ✅ Skip HTTP polling, go straight to WS
            reconnection: true,              // ✅ Auto reconnect
            reconnectionDelay: 2000,         // ✅ Wait 2s between retries
            reconnectionAttempts: 10         // ✅ Try 10 times then give up
          })

          socket.on('connect', () => {
            console.log('🔌 WebSocket connected')
          })

          // ✅ Incoming call from creator or customer
          socket.on('incoming_call', (data) => {
            console.log('📞 Incoming call via WebSocket:', data)
            setIncomingCall(data)
          })

          // ✅ Call was accepted by other party
          socket.on('call_accepted', (data) => {
            console.log('✅ Call accepted:', data)
          })

          // ✅ Call was rejected by other party
          socket.on('call_rejected', (data) => {
            console.log('📵 Call rejected:', data)
            setIncomingCall(prev =>
              prev?.room_id === data.room_id ? null : prev
            )
          })

          // ✅ Call ended by other party
          socket.on('call_ended', (data) => {
            console.log('📴 Call ended:', data)
            setIncomingCall(prev =>
              prev?.room_id === data.room_id ? null : prev
            )
          })

          // ✅ If WebSocket fails, fall back to polling
          socket.on('connect_error', (err) => {
            console.warn('⚠️ WebSocket failed, falling back to polling:', err.message)
            startPolling()
          })

          socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason)
          })

          socketRef.current = socket

        } catch (err) {
          // socket.io-client not installed — fall back to polling
          console.warn('⚠️ socket.io not available, using polling')
          startPolling()
        }
      }

      connectSocket()

      return () => {
        socket?.disconnect()
        clearInterval(pollingRef.current)
      }
    }

    // ────────────────────────────────────────────
    // MODE 2: Polling (current method, fallback)
    // ────────────────────────────────────────────
    startPolling()

    return () => {
      clearInterval(pollingRef.current)
    }

  }, [user?.id, token])

  // ✅ Polling function — used as fallback or default
  const startPolling = () => {
    // Don't start twice
    if (pollingRef.current) return

    let active = true

    const check = async () => {
      if (!active) return
      try {
        const res = await apiClient.get('/calls/incoming')
        if (!active) return
        if (res.data.call) {
          setIncomingCall(prev => {
            if (prev?.room_id === res.data.call.room_id) return prev
            return res.data.call
          })
        } else {
          setIncomingCall(null)
        }
      } catch (err) {}
    }

    pollingRef.current = setInterval(check, 5000)
    check() // immediate first check
  }

  // ✅ Clear incoming call (after accept/reject)
  const clearCall = () => setIncomingCall(null)

  return { incomingCall, clearCall }
}