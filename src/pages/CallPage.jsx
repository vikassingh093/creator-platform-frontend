import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import apiClient from "../api/client";

const AUDIO_RATE = 20;
const VIDEO_RATE = 50;

export default function CallPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const creatorId = params.creatorId || params.id || location.state?.creatorId || location.state?.creator?.id;
  const callType = location.state?.callType || "audio";

  console.log("✅ params:", params);
  console.log("✅ creatorId:", creatorId);
  console.log("✅ callType:", callType);

  const [callStatus, setCallStatus] = useState("connecting");
  const [duration, setDuration] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [creator, setCreator] = useState(location.state?.creator || {});
  const [roomId, setRoomId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const creatorIdRef = useRef(creatorId); // ✅ store in ref to avoid stale closure

  const rate = callType === "audio" ? AUDIO_RATE : VIDEO_RATE;

  useEffect(() => {
    console.log("useEffect creatorId:", creatorIdRef.current);
    if (!creatorIdRef.current) {
      setError("Missing creator ID. Please go back and try again.");
      setCallStatus("ended");
      return;
    }
    startCall(creatorIdRef.current, callType); // ✅ pass explicitly
    return () => cleanup();
  }, []);

  const startCall = async (cId, cType) => {
    try {
      const payload = {
        creator_id: parseInt(cId),
        call_type: cType
      };
      console.log("✅ Sending to API:", payload);

      const res = await apiClient.post("/calls/initiate", payload);
      const { room_id, channel_name, token, app_id } = res.data;
      setRoomId(room_id);

      console.log("✅ API Response:", res.data);

      // ✅ Skip Agora only if no app_id
      if (!app_id || app_id.length < 10) {
        console.log("⚠️ No Agora app_id - mock mode");
        setCallStatus("active");
        timerRef.current = setInterval(() => {
          durationRef.current += 1;
          setDuration(durationRef.current);
          setTotalCost(Math.ceil(durationRef.current / 60) * rate);
        }, 1000);
        return;
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // ✅ token can be null for Agora projects without certificate enabled
      await client.join(app_id, channel_name, token || null, null);

      if (cType === "video") {
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

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
        if (mediaType === "video") user.videoTrack?.play("remote-video");
      });

      setCallStatus("active");

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        setTotalCost(Math.ceil(durationRef.current / 60) * rate);
      }, 1000);

    } catch (err) {
      console.error("❌ Call error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || err.message);
      setCallStatus("ended");
    }
  };

  const endCall = async () => {
    clearInterval(timerRef.current)
    const finalDuration = durationRef.current
    console.log("📌 Ending call - duration:", finalDuration, "roomId:", roomId)

    try {
      if (roomId) {
        const res = await apiClient.post("/calls/end", {
          room_id: roomId,
          duration: finalDuration > 0 ? finalDuration : 60 // ✅ min 60 sec if timer didn't run
        })
        console.log("✅ Call ended - cost deducted:", res.data)
      } else {
        console.log("❌ No roomId - balance NOT deducted")
      }
    } catch (e) {
      console.error("❌ End call error:", e.response?.data || e.message)
    }
    cleanup()
    navigate(-1)
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    localAudioRef.current?.close();
    localVideoRef.current?.close();
    clientRef.current?.leave();
  };

  const toggleMute = () => {
    localAudioRef.current?.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    localVideoRef.current?.setEnabled(isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-purple-600 px-6 py-3 rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between p-6">
      {callType === "video" && (
        <div className="relative w-full max-w-md h-64 bg-black rounded-2xl overflow-hidden mb-4">
          <div id="remote-video" className="w-full h-full" />
          <div id="local-video" className="absolute bottom-2 right-2 w-24 h-20 bg-gray-800 rounded-lg" />
        </div>
      )}

      <div className="text-center mt-8">
        <img
          src={creator.profile_photo || creator.photo || "/default-avatar.png"}
          alt={creator.name}
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-purple-500"
        />
        <h1 className="text-white text-2xl font-bold">{creator.name}</h1>
        <p className="text-purple-300 text-sm">{creator.category || creator.specialty}</p>

        <div className="mt-4">
          {callStatus === "connecting" && (
            <p className="text-yellow-400 animate-pulse">🔄 Connecting...</p>
          )}
          {callStatus === "active" && (
            <div>
              <p className="text-green-400 text-xl font-mono">{formatDuration(duration)}</p>
              <p className="text-gray-400 text-sm mt-1">₹{rate}/min • Total: ₹{totalCost}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full mt-4">
        <span>{callType === "video" ? "📹" : "🎙️"}</span>
        <span className="text-white text-sm capitalize">{callType} Call</span>
        <span className="text-purple-400 text-sm">₹{rate}/min</span>
      </div>

      <div className="flex items-center gap-6 mt-8 mb-8">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${isMuted ? "bg-red-600" : "bg-gray-700"}`}>
          {isMuted ? "🔇" : "🎙️"}
        </button>

        <button onClick={endCall}
          className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
          📵
        </button>

        {callType === "video" ? (
          <button onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${isCameraOff ? "bg-red-600" : "bg-gray-700"}`}>
            {isCameraOff ? "📷" : "📹"}
          </button>
        ) : (
          <div className="w-14 h-14" />
        )}
      </div>
    </div>
  );
}