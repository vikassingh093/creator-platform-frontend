import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";

export default function CallPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIX: Read from sessionStorage if navigated via window.location.href
  let locationState = location.state || {};
  if (!locationState.roomId) {
    try {
      const saved = sessionStorage.getItem("callState")
      if (saved) {
        locationState = JSON.parse(saved)
        sessionStorage.removeItem("callState")  // ✅ clear after reading
      }
    } catch (e) {}
  }
  const state = locationState;

  const roomId = state.roomId;
  const channelName = state.channelName || "";
  const token = state.token || null;
  const callType = state.callType || "audio";
  const creatorName = state.creatorName || "Creator";
  const ratePerMinute = state.ratePerMinute || 20;
  const uid = state.uid || 1;

  // ✅ ALWAYS use .env variable — never use appId from API response
  const appId = import.meta.env.VITE_AGORA_APP_ID || "";

  // ✅ Add this debug line
  console.log("🔑 AGORA APP ID:", appId, "| Valid:", appId.length === 32)

  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("connecting");
  const [balance, setBalance] = useState(state.balance || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [endInfo, setEndInfo] = useState(null);

  const clientRef = useRef(null);
  const localAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const durationRef = useRef(0);
  const hasEndedRef = useRef(false);
  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (!roomId) {
      navigate(-1);
      return;
    }
    console.log("📞 CallPage state:", { roomId, channelName, uid, appId, hasToken: !!token });
    startCall();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    clearInterval(tickRef.current);
    localAudioRef.current?.close();
    localVideoRef.current?.close();
    clientRef.current?.leave().catch(() => {});
  };

  const startCall = async () => {
    try {
      setCallStatus("connecting");

      // ✅ Small delay to let backend settle before polling
      await new Promise(r => setTimeout(r, 500));

      // ✅ If this is a creator-initiated call that the customer already accepted,
      //    the room is already 'active' — skip the long polling
      const isAlreadyAccepted = state.initiatedBy === 'creator';

      // ✅ Poll for room to become active
      let attempts = 0;
      while (attempts < 30) {
        const res = await apiClient.get(`/calls/status/${roomId}`);
        const status = res.data?.status;
        console.log(`⏳ Room status: ${status} (attempt ${attempts + 1})`);

        if (status === "active") break;

        // ✅ KEY FIX: if ended, wait 2 more seconds then confirm before rejecting
        if (status === "ended") {
          if (attempts < 2) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
            continue;
          }
          setCallStatus("rejected");
          return;
        }

        // status === "ringing" → keep waiting
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
      }

      if (attempts >= 30) {
        setCallStatus("timeout");
        return;
      }

      console.log("✅ Room active - joining Agora now");
      console.log("🔍 AppId:", appId, "| Length:", appId.length);
      console.log("🔍 Channel:", channelName);
      console.log("🔍 Token:", token ? token.substring(0, 20) + "..." : "NULL");
      console.log("🔍 UID:", uid);

      if (!appId || appId.length < 10) {
        console.warn("⚠️ No valid VITE_AGORA_APP_ID — using mock mode");
        setCallStatus("active");
        startTimer();
        startTick();
        return;
      }

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(1);

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        console.log("✅ Remote user published:", user.uid, mediaType);
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
        if (mediaType === "video") user.videoTrack?.play("remote-video");
      });

      client.on("user-left", () => {
        console.log("📴 Remote user left");
        endCall();
      });

      client.on("connection-state-change", (state) => {
        console.log("🔗 Connection state:", state);
      });

      // ✅ Join with correct uid=1 for user
      console.log("🚀 Joining Agora channel...");
      await client.join(appId, channelName, token || null, uid);
      console.log("✅ Joined Agora successfully with uid:", uid);

      if (callType === "video") {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;
        await client.publish([audioTrack, videoTrack]);
        videoTrack.play("local-video");
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioRef.current = audioTrack;
        await client.publish([audioTrack]);
      }

      console.log("✅ Published audio track");
      setCallStatus("active");
      startTimer();
      startTick();

    } catch (err) {
      console.error("❌ Call failed:", err.message, err);
      setCallStatus("error");
    }
  };

  const startTimer = () => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(d => d + 1);
    }, 1000);
  };

  const startTick = () => {
    tickRef.current = setInterval(async () => {
      try {
        const res = await apiClient.post("/calls/tick", { room_id: Number(roomId) });
        const data = res.data;
        if (data.balance !== undefined) setBalance(data.balance);
        if (data.should_end) {
          console.log("💸 Balance exhausted - ending call");
          endCall();
        }
      } catch (e) {
        console.error("Tick error:", e);
      }
    }, 5000);
  };

  const endCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    cleanup();
    const finalDuration = durationRef.current;

    try {
      const res = await apiClient.post("/calls/end", {
        room_id: Number(roomId),
        duration: finalDuration
      });
      setEndInfo({ duration: finalDuration, ...res.data });
    } catch (e) {
      console.error("❌ End call error:", e);
      setEndInfo({ duration: finalDuration });
    }

    setCallStatus("ended");
  };

  const toggleMute = () => {
    localAudioRef.current?.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── ENDED ────────────────────────────────────────────────
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
            </div>
          )}
          <button
            onClick={() => navigate("/home", { replace: true })}
            className="w-full bg-purple-600 py-4 rounded-2xl font-bold text-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // ─── REJECTED / TIMEOUT ───────────────────────────────────
  if (callStatus === "rejected" || callStatus === "timeout") {

    // 🚫 CALL BACK FEATURE — TEMPORARILY DISABLED
    // TODO: Re-enable this when call-back flow is fully tested
    // The issue was: after call-back, new room polled too fast and got "ended"
    // status from stale DB read, causing immediate rejection screen again.
    // Fix needed before re-enabling:
    //   1. Add proper delay before polling new room
    //   2. Ensure creator polling picks up new room correctly
    //   3. Test full flow: user calls → rejected → calls back → creator accepts → active
    //
    // const handleCallBack = async () => {
    //   try {
    //     const res = await apiClient.post("/calls/initiate", {
    //       creator_id: state.creatorId,
    //       call_type: callType
    //     })
    //     const data = res.data
    //     console.log("📞 Call back initiated:", data)
    //     sessionStorage.setItem("callState", JSON.stringify({
    //       roomId: data.room_id,
    //       channelName: data.channel_name,
    //       token: data.token,
    //       uid: data.uid,
    //       callType: callType,
    //       creatorName: creatorName,
    //       ratePerMinute: data.rate_per_minute,
    //       balance: data.balance,
    //       creatorId: state.creatorId,
    //     }))
    //     window.location.href = "/call"
    //   } catch (err) {
    //     alert(err.response?.data?.detail || "Failed to call back")
    //   }
    // }

    // ✅ Auto-redirect to creator profile after 5 seconds
    setTimeout(() => {
      if (state.creatorId) {
        navigate(`/creator/${state.creatorId}`, { replace: true })
      } else {
        navigate(-1)
      }
    }, 5000)

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center text-white w-full max-w-sm">
          <div className="text-7xl mb-4">📵</div>
          <h2 className="text-2xl font-bold mb-2">
            {callStatus === "rejected" ? "Call Rejected" : "No Answer"}
          </h2>
          <p className="text-gray-400 mb-8">
            {callStatus === "rejected"
              ? "Creator declined your call."
              : "Creator did not respond."}
          </p>

          {/* 🚫 CALL BACK BUTTON — TEMPORARILY DISABLED (see comment above) */}
          {/* {state.creatorId && (
            <button
              onClick={handleCallBack}
              className="w-full bg-green-600 py-4 rounded-2xl font-bold text-lg mb-3 flex items-center justify-center gap-2 active:scale-95"
            >
              📞 Call Back
            </button>
          )} */}

          {/* ✅ Go Back → navigates back to creator profile page */}
          <button
            onClick={() => state.creatorId
              ? navigate(`/creator/${state.creatorId}`, { replace: true })
              : navigate(-1)
            }
            className="w-full bg-gray-700 py-4 rounded-2xl font-bold text-lg"
          >
            Go Back
          </button>

          <p className="text-gray-500 text-sm mt-4">
            Returning to creator profile in 5 seconds...
          </p>
        </div>
      </div>
    )
  }

  // ─── ERROR ────────────────────────────────────────────────
  if (callStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-7xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-red-400 mb-6">Failed to connect audio. Please try again.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-purple-600 px-6 py-3 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // ─── ACTIVE CALL UI ───────────────────────────────────────
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
          🎭
        </div>
        <h1 className="text-white text-2xl font-bold">{creatorName}</h1>
        <p className="text-purple-300 text-sm capitalize mt-1">{callType} Call</p>

        <div className="mt-6">
          {callStatus === "connecting" && (
            <p className="text-yellow-400 animate-pulse text-lg">🔄 Connecting...</p>
          )}
          {callStatus === "active" && (
            <div>
              <p className="text-green-400 text-3xl font-mono font-bold">
                {formatTime(duration)}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                ₹{ratePerMinute}/min • Balance: ₹{balance}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom pill info */}
      {callStatus === "active" && (
        <div className="bg-gray-800 rounded-full px-5 py-2 mb-4 flex items-center gap-2">
          <span className="text-white text-sm">🎙 ₹{ratePerMinute}/min</span>
          <span className="text-gray-400">•</span>
          <span className="text-green-400 text-sm font-bold">₹{balance} left</span>
        </div>
      )}

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