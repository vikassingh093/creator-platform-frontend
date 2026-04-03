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
  const appId = import.meta.env.VITE_AGORA_APP_ID
  const callType = state.callType || "audio"
  const callerName = state.callerName || "User"
  const ratePerMinute = callType === "audio" ? 20 : 50

  const [duration, setDuration] = useState(0)
  const [callStatus, setCallStatus] = useState("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [endInfo, setEndInfo] = useState(null)
  const [balance, setBalance] = useState(null)

  const clientRef = useRef(null)
  const localAudioRef = useRef(null)
  const localVideoRef = useRef(null)
  const timerRef = useRef(null)
  const tickRef = useRef(null)
  const durationRef = useRef(0)
  const hasEndedRef = useRef(false)
  const timerStartedRef = useRef(false)

  useEffect(() => {
    if (!roomId) {
      navigate("/creator-dashboard")
      return
    }
    joinCall()
    return () => cleanup()
  }, [])

  const cleanup = () => {
    clearInterval(timerRef.current)
    clearInterval(tickRef.current)
    localAudioRef.current?.close()
    localVideoRef.current?.close()
    clientRef.current?.leave().catch(() => {})
  }

  const joinCall = async () => {
    try {
      setCallStatus("connecting")
      await apiClient.post(`/calls/accept/${roomId}`)

      console.log("🔑 Creator Agora:", { appId, channelName, uid: state.uid || 2, hasToken: !!token })

      if (!appId || appId.length < 10) {
        setCallStatus("active")
        startTimer()
        startTick()
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

      setCallStatus("waiting")

    } catch (err) {
      console.error("❌ Creator join error:", err)
      setCallStatus("error")
    }
  }

  const startTimer = () => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    setCallStatus("active")
    startTick()
    console.log("✅ Both connected - timer started")
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(d => d + 1)
    }, 1000)
  }

  // ✅ NEW: Tick polling — creator sees user's balance
  const startTick = () => {
    if (tickRef.current) return
    tickRef.current = setInterval(async () => {
      try {
        const res = await apiClient.post("/calls/tick", { room_id: Number(roomId) })
        const data = res.data
        if (data.balance !== undefined) setBalance(data.balance)
        if (data.should_end) {
          console.log("💸 User balance exhausted — ending call")
          endCall()
        }
      } catch (e) {
        console.error("Tick error:", e)
      }
    }, 5000)
  }

  const endCall = async () => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true

    cleanup()
    const finalDuration = durationRef.current

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

  const toggleVideo = () => {
    if (callType !== "video") return
    localVideoRef.current?.setEnabled(isVideoOff)
    setIsVideoOff(!isVideoOff)
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // ─── ENDED SCREEN ─────────────────────────────────────────
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
                  ₹{((Math.ceil(endInfo.duration / 60)) * ratePerMinute * 0.8).toFixed(2)}
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

  // ─── ACTIVE: VIDEO CALL — FULLSCREEN ──────────────────────
  if (callType === "video") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* ✅ Remote video — FULLSCREEN */}
        <div id="remote-video" className="absolute inset-0 w-full h-full bg-black" />

        {/* ✅ Local video — small PIP */}
        <div
          id="local-video"
          className="absolute top-4 right-4 w-28 h-36 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20"
        />

        {/* ✅ Top overlay — caller name + timer */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pt-12 pb-8 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{callerName}</h2>
              <p className="text-white/60 text-xs capitalize">{callType} Call</p>
            </div>
            <div className="text-right">
              {callStatus === "connecting" ? (
                <p className="text-yellow-400 animate-pulse text-sm">Connecting...</p>
              ) : callStatus === "waiting" ? (
                <p className="text-blue-400 animate-pulse text-sm">Waiting for user...</p>
              ) : (
                <p className="text-green-400 font-mono font-bold text-xl">
                  {formatTime(duration)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ User balance pill — visible to creator */}
        {callStatus === "active" && balance !== null && (
          <div className="absolute top-24 left-0 right-0 z-20 flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-white/70 text-xs">User Balance:</span>
              <span className={`text-sm font-bold ${balance < ratePerMinute ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                ₹{balance}
              </span>
              {balance < ratePerMinute && (
                <span className="text-red-400 text-[10px]">• ending soon</span>
              )}
            </div>
          </div>
        )}

        {/* ✅ Bottom overlay — controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-10 pt-16 px-6">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-white/70 text-xs">₹{ratePerMinute}/min</span>
              <span className="text-white/30">•</span>
              <span className="text-green-400 text-xs font-bold">You earn 80%</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition active:scale-90 ${
                isMuted ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"
              }`}
            >
              {isMuted ? "🔇" : "🎙️"}
            </button>

            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition active:scale-90 ${
                isVideoOff ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"
              }`}
            >
              {isVideoOff ? "📷" : "📹"}
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-90 transition"
            >
              📵
            </button>

            <div className="w-14 h-14" />
          </div>
        </div>
      </div>
    )
  }

  // ─── ACTIVE: AUDIO CALL ───────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between p-6">

      <div className="text-center mt-16 flex-1 flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-5xl mb-6 shadow-lg shadow-purple-500/30">
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
              <p className="text-green-400 text-4xl font-mono font-bold">
                {formatTime(duration)}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ₹{ratePerMinute}/min • You earn 80%
              </p>

              {/* ✅ User balance — visible to creator */}
              {balance !== null && (
                <div className="mt-3 bg-gray-800 rounded-full px-4 py-1.5 inline-flex items-center gap-2">
                  <span className="text-gray-400 text-xs">User Balance:</span>
                  <span className={`text-sm font-bold ${balance < ratePerMinute ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                    ₹{balance}
                  </span>
                  {balance < ratePerMinute && (
                    <span className="text-red-400 text-[10px]">• ending soon</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-8 mb-12">
        <button
          onClick={toggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition active:scale-90 ${
            isMuted ? "bg-red-500" : "bg-gray-700"
          }`}
        >
          {isMuted ? "🔇" : "🎙️"}
        </button>

        <button
          onClick={endCall}
          className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-95 transition"
        >
          📵
        </button>

        <div className="w-16 h-16" />
      </div>
    </div>
  )
}