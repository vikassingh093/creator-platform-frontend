import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";
import useAuthStore from "../store/authStore";

export default function CallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // ✅ Read from sessionStorage if navigated via window.location.href
  let locationState = location.state || {};
  if (!locationState.roomId) {
    try {
      const saved = sessionStorage.getItem("callState");
      if (saved) {
        locationState = JSON.parse(saved);
        sessionStorage.removeItem("callState");
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

  const appId = import.meta.env.VITE_AGORA_APP_ID || "";

  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("connecting");
  const [balance, setBalance] = useState(state.balance || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [endInfo, setEndInfo] = useState(null);
  const [lowBalanceWarnings, setLowBalanceWarnings] = useState(0);
  const [showLowBalanceAlert, setShowLowBalanceAlert] = useState(false);

  const clientRef = useRef(null);
  const localAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const durationRef = useRef(0);
  const hasEndedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const lowBalanceCountRef = useRef(0);

  // ✅ Determine if current user is the creator or customer
  const isCreator = user?.user_type === "creator";

  useEffect(() => {
    if (!roomId) {
      navigate(-1);
      return;
    }
    console.log("📞 CallPage state:", { roomId, channelName, uid, appId, hasToken: !!token, isCreator });
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
      await new Promise((r) => setTimeout(r, 500));

      let attempts = 0;
      while (attempts < 30) {
        const res = await apiClient.get(`/calls/status/${roomId}`);
        const status = res.data?.status;
        console.log(`⏳ Room status: ${status} (attempt ${attempts + 1})`);

        if (status === "active") break;

        if (status === "ended") {
          if (attempts < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            attempts++;
            continue;
          }
          setCallStatus("rejected");
          return;
        }

        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
      }

      if (attempts >= 30) {
        setCallStatus("timeout");
        return;
      }

      console.log("✅ Room active - joining Agora now");

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

      console.log("✅ Published tracks");
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
      setDuration((d) => d + 1);
    }, 1000);
  };

  const startTick = () => {
    tickRef.current = setInterval(async () => {
      try {
        const res = await apiClient.post("/calls/tick", { room_id: Number(roomId) });
        const data = res.data;

        if (data.balance !== undefined) setBalance(data.balance);

        // ✅ Auto-end if backend says so
        if (data.should_end) {
          console.log("💸 Balance exhausted - ending call");
          endCall("insufficient_balance");
          return;
        }

        // ✅ Low balance warning — only for CUSTOMER, max 3 times
        if (!isCreator && data.low_balance && lowBalanceCountRef.current < 3) {
          lowBalanceCountRef.current += 1;
          setLowBalanceWarnings(lowBalanceCountRef.current);
          setShowLowBalanceAlert(true);
          // Auto-hide after 3 seconds
          setTimeout(() => setShowLowBalanceAlert(false), 3000);
        }
      } catch (e) {
        console.error("Tick error:", e);
      }
    }, 5000);
  };

  const endCall = async (reason) => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    cleanup();
    const finalDuration = durationRef.current;

    try {
      const res = await apiClient.post("/calls/end", {
        room_id: Number(roomId),
        duration: finalDuration,
      });
      setEndInfo({ duration: finalDuration, reason, ...res.data });
    } catch (e) {
      console.error("❌ End call error:", e);
      setEndInfo({ duration: finalDuration, reason });
    }

    setCallStatus("ended");
  };

  const toggleMute = () => {
    localAudioRef.current?.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (callType !== "video") return;
    localVideoRef.current?.setEnabled(isVideoOff);
    setIsVideoOff(!isVideoOff);
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
          <h2 className="text-2xl font-bold mb-2">Call Ended</h2>

          {/* ✅ Show reason if balance ran out */}
          {endInfo?.reason === "insufficient_balance" && !isCreator && (
            <p className="text-red-400 text-sm mb-4">
              ⚠️ Call ended due to insufficient balance
            </p>
          )}

          {endInfo && endInfo.duration > 0 && (
            <div className="bg-gray-800 rounded-2xl p-4 mb-6 space-y-2 text-left">
              <h3 className="text-center font-bold text-purple-300 mb-3">📊 Summary</h3>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="font-bold">{formatTime(endInfo.duration)}</span>
              </div>
              {endInfo.total_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Cost</span>
                  <span className="font-bold text-yellow-400">₹{endInfo.total_cost}</span>
                </div>
              )}
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
    );
  }

  // ─── REJECTED / TIMEOUT ───────────────────────────────────
  if (callStatus === "rejected" || callStatus === "timeout") {
    setTimeout(() => {
      if (state.creatorId) {
        navigate(`/creator/${state.creatorId}`, { replace: true });
      } else {
        navigate(-1);
      }
    }, 5000);

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
          <button
            onClick={() =>
              state.creatorId
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
    );
  }

  // ─── ERROR ────────────────────────────────────────────────
  if (callStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-7xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-red-400 mb-6">Failed to connect. Please try again.</p>
          <button onClick={() => navigate(-1)} className="bg-purple-600 px-6 py-3 rounded-xl font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE CALL UI ───────────────────────────────────────

  // ✅ VIDEO CALL — fullscreen layout with overlay controls
  if (callType === "video") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* ✅ Remote video — FULLSCREEN */}
        <div id="remote-video" className="absolute inset-0 w-full h-full bg-black" />

        {/* ✅ Local video — small PIP in top-right */}
        <div
          id="local-video"
          className="absolute top-4 right-4 w-28 h-36 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20"
        />

        {/* ✅ Low balance alert toast — CUSTOMER only */}
        {showLowBalanceAlert && !isCreator && (
          <div className="absolute top-4 left-4 right-36 z-30 animate-pulse">
            <div className="bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
              ⚠️ Low balance! Only ₹{balance} left. Call will end soon.
            </div>
          </div>
        )}

        {/* ✅ Top overlay — name + timer */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pt-12 pb-8 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{creatorName}</h2>
              <p className="text-white/60 text-xs capitalize">{callType} Call</p>
            </div>
            <div className="text-right">
              {callStatus === "connecting" ? (
                <p className="text-yellow-400 animate-pulse text-sm">Connecting...</p>
              ) : (
                <p className="text-green-400 font-mono font-bold text-xl">
                  {formatTime(duration)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Creator sees user balance | Customer sees nothing */}
        {callStatus === "active" && isCreator && (
          <div className="absolute top-24 left-0 right-0 z-20 flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-white/70 text-xs">User Balance:</span>
              <span className={`text-sm font-bold ${balance < ratePerMinute ? 'text-red-400' : 'text-green-400'}`}>
                ₹{balance}
              </span>
            </div>
          </div>
        )}

        {/* ✅ Bottom overlay — controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-10 pt-16 px-6">
          {/* Rate info pill — creator sees balance, customer doesn't */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-white/70 text-xs">₹{ratePerMinute}/min</span>
            </div>
          </div>

          {/* Control buttons */}
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
              onClick={() => endCall()}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-90 transition"
            >
              📵
            </button>

            {/* Spacer for symmetry */}
            <div className="w-14 h-14" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ AUDIO CALL — centered layout (no video)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between p-6">

      {/* ✅ Low balance alert toast — CUSTOMER only */}
      {showLowBalanceAlert && !isCreator && (
        <div className="fixed top-6 left-4 right-4 z-50 animate-pulse">
          <div className="bg-red-600/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-lg text-center">
            ⚠️ Low balance! Only ₹{balance} left. Call will end soon.
          </div>
        </div>
      )}

      <div className="text-center mt-16 flex-1 flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-5xl mb-6 shadow-lg shadow-green-500/30">
          🎙️
        </div>
        <h1 className="text-white text-2xl font-bold">{creatorName}</h1>
        <p className="text-green-300 text-sm capitalize mt-1">Audio Call</p>

        <div className="mt-6">
          {callStatus === "connecting" ? (
            <p className="text-yellow-400 animate-pulse text-lg">🔄 Connecting...</p>
          ) : (
            <div>
              <p className="text-green-400 text-4xl font-mono font-bold">
                {formatTime(duration)}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ₹{ratePerMinute}/min
              </p>

              {/* ✅ Creator sees user balance */}
              {isCreator && (
                <div className="mt-3 bg-gray-800 rounded-full px-4 py-1.5 inline-flex items-center gap-2">
                  <span className="text-gray-400 text-xs">User Balance:</span>
                  <span className={`text-sm font-bold ${balance < ratePerMinute ? 'text-red-400' : 'text-green-400'}`}>
                    ₹{balance}
                  </span>
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
          onClick={() => endCall()}
          className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-2xl active:scale-95 transition"
        >
          📵
        </button>

        <div className="w-16 h-16" />
      </div>
    </div>
  );
}