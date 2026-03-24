import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import apiClient from "../api/client"

export default function CreatorCallPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId: paramRoomId } = useParams()

  // ✅ Safe fallback if state is missing
  const state = location.state || {}
  const roomId = state.roomId || paramRoomId
  const channelName = state.channelName || ""
  const token = state.token || null
  const appId = state.appId || ""
  const callType = state.callType || "audio"
  const callerName = state.callerName || "User"

  const [duration, setDuration] = useState(0)
  const [callStatus, setCallStatus] = useState("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isEnding, setIsEnding] = useState(false) // ✅ prevent double end

  const clientRef = useRef(null)
  const localAudioRef = useRef(null)
  const localVideoRef = useRef(null)
  const timerRef = useRef(null)
  const durationRef = useRef(0)
  const hasEndedRef = useRef(false) // ✅ prevent double end

  useEffect(() => {
    console.log("🎬 CreatorCallPage mounted - roomId:", roomId, "callType:", callType)
    
    if (!roomId) {
      console.error("❌ No roomId found - going back")
      navigate("/creator-dashboard")
      return
    }

    joinCall()

    // ✅ Only cleanup audio/video tracks on unmount, NOT end the call
    return () => {
      console.log("🧹 CreatorCallPage unmounting - cleaning up tracks only")
      clearInterval(timerRef.current)
      localAudioRef.current?.close()
      localVideoRef.current?.close()
      clientRef.current?.leave().catch(() => {})
    }
  }, [])

  const joinCall = async () => {
    try {
      console.log("📞 Creator joining call - appId:", appId, "channel:", channelName)

      // ✅ Keep status as "connecting" until actually joined
      setCallStatus("connecting")

      if (!appId || appId.length < 10) {
        console.log("⚠️ No Agora appId - mock mode, starting timer now")
        // ✅ In mock mode - start timer immediately (creator accepted = picked up)
        setCallStatus("active")
        startTimer()
        return
      }

      let AgoraRTC
      try {
        AgoraRTC = (await import("agora-rtc-sdk-ng")).default
      } catch (e) {
        console.log("⚠️ Agora SDK not available - mock mode")
        setCallStatus("active")
        startTimer()
        return
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      clientRef.current = client

      await client.join(appId, channelName, token || null, null)
      console.log("✅ Creator joined Agora channel")

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
      })

      client.on("user-left", () => {
        console.log("📴 User left the channel")
        endCall()
      })

      // ✅ Timer starts AFTER successfully joining = creator picked up
      setCallStatus("active")
      startTimer()
      console.log("✅ Timer started - billing begins now")

    } catch (err) {
      console.error("❌ Creator join error:", err)
      setCallStatus("active")
      startTimer() // ✅ Still start timer - creator accepted the call
    }
  }

  // ✅ Separate timer function
  const startTimer = () => {
    clearInterval(timerRef.current) // clear any existing
    durationRef.current = 0
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(d => d + 1)
    }, 1000)
  }

  const endCall = async () => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true
    setIsEnding(true)

    clearInterval(timerRef.current)
    const finalDuration = durationRef.current
    console.log("📌 Ending call - duration:", finalDuration, "secs =", Math.ceil(finalDuration / 60), "mins (ceil)")

    localAudioRef.current?.close()
    localVideoRef.current?.close()
    try { await clientRef.current?.leave() } catch (e) {}

    try {
      const res = await apiClient.post("/calls/end", {
        room_id: Number(roomId),
        duration: finalDuration  // ✅ Send actual duration, backend does ceil
      })
      console.log("✅ Call ended:", res.data)
    } catch (e) {
      console.error("❌ End call error:", e.response?.data || e.message)
    }

    navigate("/creator-dashboard", { replace: true })
  }

  const toggleMute = () => {
    if (localAudioRef.current) {
      const newMuted = !isMuted
      localAudioRef.current.setEnabled(!newMuted)
      setIsMuted(newMuted)
    }
  }

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between p-6">

      {/* Video area */}
      {callType === "video" && (
        <div className="relative w-full max-w-md h-64 bg-black rounded-2xl overflow-hidden mb-4">
          <div id="remote-video" className="w-full h-full" />
          <div id="local-video" className="absolute bottom-2 right-2 w-24 h-20 bg-gray-800 rounded-lg" />
        </div>
      )}

      {/* Call info */}
      <div className="text-center mt-8 flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl mb-4">
          👤
        </div>
        <h1 className="text-white text-2xl font-bold">{callerName}</h1>
        <p className="text-purple-300 text-sm capitalize mt-1">{callType} Call</p>

        {callStatus === "active" && (
          <p className="text-green-400 text-2xl font-mono mt-4">
            {formatDuration(duration)}
          </p>
        )}
        {callStatus === "connecting" && (
          <p className="text-yellow-400 animate-pulse mt-4 text-lg">🔄 Connecting...</p>
        )}

        {/* Rate info */}
        <p className="text-gray-500 text-xs mt-2">
          ₹{callType === "audio" ? 20 : 50}/min
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition ${
            isMuted ? "bg-red-600" : "bg-gray-700"
          }`}
        >
          {isMuted ? "🔇" : "🎙️"}
        </button>

        <button
          onClick={endCall}
          disabled={isEnding}
          className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl disabled:opacity-50 active:scale-95 transition"
        >
          {isEnding ? "⏳" : "📵"}
        </button>

        <div className="w-14 h-14" />
      </div>
    </div>
  )
}