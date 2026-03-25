import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

export default function CallModal({ creatorId, creatorName, onClose }) {
  const navigate = useNavigate();
  const isCallingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState("")

  const startCall = async (selectedCallType) => {
    console.log("🔴 startCall:", selectedCallType, "creatorId:", creatorId)
    setDebugMsg(`Starting ${selectedCallType} call...`)

    if (isCallingRef.current) return;
    isCallingRef.current = true;
    setLoading(true);

    try {
      const res = await apiClient.post("/calls/initiate", {
        creator_id: Number(creatorId),
        call_type: selectedCallType,
      });

      const data = res.data;
      console.log("✅ API success:", data)

      onClose?.();

      navigate("/call", {
        state: {
          roomId: data.room_id,
          channelName: data.channel_name,
          token: data.token,
          uid: data.uid || 1,
          callType: data.call_type,
          creatorName: data.creator?.name || creatorName || "Creator",
          ratePerMinute: data.rate_per_minute,
          balance: data.balance,
          creatorId: Number(creatorId),  // ✅ ADD THIS — needed for call back
        },
      });

    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message)
      setDebugMsg(`ERROR: ${err.response?.data?.detail || err.message}`)
      alert(err.response?.data?.detail || "Failed to start call");
      isCallingRef.current = false;
      setLoading(false);
    }
  };

  return (
    // ✅ stopPropagation on overlay click — prevent background button clicks
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}  // ✅ KEY FIX
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white"
        onClick={(e) => e.stopPropagation()}  // ✅ KEY FIX
      >
        <h2 className="text-xl font-bold text-center mb-1">Call {creatorName}</h2>
        <p className="text-gray-400 text-center text-sm mb-2">Choose call type</p>

        {debugMsg && (
          <p className="text-yellow-400 text-center text-xs mb-3 bg-gray-800 p-2 rounded">
            {debugMsg}
          </p>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()  // ✅ KEY FIX
              e.preventDefault()
              startCall("audio")
            }}
            disabled={loading}
            className="w-full flex items-center justify-between bg-green-600 hover:bg-green-500 disabled:opacity-50 py-4 px-6 rounded-2xl font-bold text-lg transition active:scale-95"
          >
            <span>🎙️ Audio Call</span>
            <span className="text-sm font-normal bg-green-700 px-3 py-1 rounded-full">₹20/min</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()  // ✅ KEY FIX
              e.preventDefault()
              startCall("video")
            }}
            disabled={loading}
            className="w-full flex items-center justify-between bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 px-6 rounded-2xl font-bold text-lg transition active:scale-95"
          >
            <span>📹 Video Call</span>
            <span className="text-sm font-normal bg-purple-700 px-3 py-1 rounded-full">₹50/min</span>
          </button>
        </div>

        {loading && (
          <p className="text-center text-yellow-400 animate-pulse mb-3">
            📞 Connecting...
          </p>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
          disabled={loading}
          className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl font-semibold text-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
