import { useNavigate } from "react-router-dom";

export default function CallModal({ creator, onClose }) {
  const navigate = useNavigate();

  const startCall = (callType) => {
    const creatorId = creator.id || creator.user_id;
    console.log("Starting call - creatorId:", creatorId, "callType:", callType);
    onClose();
    navigate(`/call/${creatorId}`, {
      state: { 
        callType, 
        creator,
        creatorId  // ✅ pass explicitly in state as fallback
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-80 text-center border border-gray-700">
        <img
          src={creator.profile_photo || "/default-avatar.png"}
          alt={creator.name}
          className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
        />
        <h3 className="text-white text-xl font-bold">{creator.name}</h3>
        <p className="text-gray-400 text-sm mb-6">{creator.category}</p>
        <p className="text-gray-400 text-sm mb-4">Choose call type:</p>

        <button
          onClick={() => startCall("audio")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl mb-3 flex items-center justify-between px-6"
        >
          <span className="text-xl">🎙️</span>
          <span className="font-semibold">Audio Call</span>
          <span className="text-green-200 text-sm">₹20/min</span>
        </button>

        <button
          onClick={() => startCall("video")}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl mb-4 flex items-center justify-between px-6"
        >
          <span className="text-xl">📹</span>
          <span className="font-semibold">Video Call</span>
          <span className="text-purple-200 text-sm">₹50/min</span>
        </button>

        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}