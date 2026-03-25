import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import apiClient from "../api/client"

export default function CreatorCallPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId: paramRoomId } = useParams()

  const state = location.state || {}
  const roomId = state.roomId || paramRoomId
  const channelName = state.channelName || ""
  const token = state.token || null
  const appId = import.meta.env.VITE_AGORA_APP_ID  // ✅ from .env
  const callType = state.callType || "audio"
  const callerName = state.callerName || "User"

  const [duration, setDuration] = useState(0)
  const [callStatus, setCallStatus] = useState("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [endInfo, setEndInfo] = useState(null)

  const clientRef = useRef(null)
  const localAudioRef = useRef(null)
  const localVideoRef = useRef(null)
  const timerRef = useRef(null)
  const durationRef = useRef(0)
  const hasEndedRef = useRef(false)
  const timerStartedRef = useRef(false)

  useEffect(() => {
    if (!roomId) {
      navigate("/creator-dashboard")
      return
    }
    joinCall()
    return () => {
      clearInterval(timerRef.current)
      localAudioRef.current?.close()
      localVideoRef.current?.close()
      clientRef.current?.leave().catch(() => {})
    }
  }, [])

  const joinCall = async () => {
    try {
      setCallStatus("connecting")
      await apiClient.post(`/calls/accept/${roomId}`)

      console.log("🔍 Creator Agora:", { appId, channelName, uid: state.uid || 2, hasToken: !!token })

      if (!appId || appId.length < 10) {
        setCallStatus("active")
        startTimer()
        return
      }

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      clientRef.current = client

      await client.join(appId, channelName, token || null, state.uid || 2)
      console.log("✅ Creator joined Agora with uid:", state.uid || 2)

      if (callType === "video") {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudioRef.current = audioTrack
        localVideoRef.current = videoTrack
        await client.publish([audioTrack, videoTrack])
        videoTrack.play("local-video")
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        localAudioRef.current = audioTrack
        await client.publish([audioTrack])
      }

      // ✅ Timer starts ONLY when user's stream received = both connected
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === "audio") user.audioTrack?.play()
        if (mediaType === "video") user.videoTrack?.play("remote-video")
        startTimer()
      })

      client.on("user-left", () => {
        console.log("📴 User left")
        endCall()
      })

      setCallStatus("waiting") // waiting for user stream

    } catch (err) {
      console.error("❌ Creator join error:", err)
      setCallStatus("error")
    }
  }

  const startTimer = () => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    setCallStatus("active")
    console.log("✅ Both connected - timer started")
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(d => d + 1)
    }, 1000)
  }

  const endCall = async () => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true

    clearInterval(timerRef.current)
    const finalDuration = durationRef.current

    localAudioRef.current?.close()
    localVideoRef.current?.close()
    try { await clientRef.current?.leave() } catch (e) {}

    try {
      await apiClient.post("/calls/end", {
        room_id: Number(roomId),
        duration: finalDuration
      })
    } catch (e) {
      console.error("❌ End call error:", e)
    }

    setEndInfo({ duration: finalDuration })
    setCallStatus("ended")
  }

  const toggleMute = () => {
    localAudioRef.current?.setEnabled(isMuted)
    setIsMuted(!isMuted)
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // ─── ENDED SCREEN ────────────────────────────────────────
  if (callStatus === "ended") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center text-white w-full max-w-sm">
          <div className="text-7xl mb-4">📵</div>
          <h2 className="text-2xl font-bold mb-4">Call Ended</h2>
          {endInfo && endInfo.duration > 0 && (
            <div className="bg-gray-800 rounded-2xl p-4 mb-6 space-y-2 text-left">
              <h3 className="text-center font-bold text-purple-300 mb-3">📊 Summary</h3>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="font-bold">{formatTime(endInfo.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Earning (80%)</span>
                <span className="font-bold text-green-400">
                  ₹{((Math.ceil(endInfo.duration / 60)) * (callType === "audio" ? 20 : 50) * 0.8).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate("/creator-dashboard", { replace: true })}
            className="w-full bg-purple-600 py-4 rounded-2xl font-bold text-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── ERROR SCREEN ─────────────────────────────────────────
  if (callStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-7xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
          <button
            onClick={() => navigate("/creator-dashboard", { replace: true })}
            className="bg-purple-600 px-6 py-3 rounded-xl font-bold mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between p-6">
      {callType === "video" && (
        <div className="relative w-full max-w-md h-64 bg-black rounded-2xl overflow-hidden mb-4">
          <div id="remote-video" className="w-full h-full" />
          <div id="local-video" className="absolute bottom-2 right-2 w-24 h-20 bg-gray-800 rounded-lg" />
        </div>
      )}

      <div className="text-center mt-8 flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl mb-4">
          👤
        </div>
        <h1 className="text-white text-2xl font-bold">{callerName}</h1>
        <p className="text-purple-300 text-sm capitalize mt-1">{callType} Call</p>

        <div className="mt-6">
          {callStatus === "connecting" && (
            <p className="text-yellow-400 animate-pulse text-lg">🔄 Connecting...</p>
          )}
          {callStatus === "waiting" && (
            <p className="text-blue-400 animate-pulse text-lg">⏳ Waiting for customer...</p>
          )}
          {callStatus === "active" && (
            <div>
              <p className="text-green-400 text-3xl font-mono font-bold">
                {formatTime(duration)}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                ₹{callType === "audio" ? 20 : 50}/min
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 mb-8">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg ${
            isMuted ? "bg-red-600" : "bg-gray-700"
          }`}
        >
          {isMuted ? "🔇" : "🎙️"}
        </button>

        <button
          onClick={endCall}
          className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-95"
        >
          📵
        </button>

        <div className="w-14 h-14" />
      </div>
    </div>
  )
}