export default function VideoCall({ creator, duration, formatDuration, totalCost, isVideoOn }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Remote Video (Creator) - Full Screen */}
      <div className="w-full h-64 bg-gray-800 rounded-3xl overflow-hidden mb-4 relative">
        {isVideoOn ? (
          <img
            src={creator.photo}
            alt={creator.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-6xl mb-2">📷</div>
              <p className="text-white text-sm">Camera Off</p>
            </div>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-50 px-3 py-1 rounded-full">
          <p className="text-white text-sm font-mono">{formatDuration(duration)}</p>
        </div>

        {/* Cost Badge */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-50 px-3 py-1 rounded-full">
          <p className="text-white text-sm">₹{totalCost}</p>
        </div>

        {/* Creator Name */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold">{creator.name}</p>
          <p className="text-green-400 text-xs">📹 Video Connected</p>
        </div>
      </div>

      {/* Local Video (User) - Small */}
      <div className="absolute top-4 right-4 w-24 h-32 bg-gray-700 rounded-2xl overflow-hidden border-2 border-purple-400 shadow-lg">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-800">
          <p className="text-white text-xs text-center">You</p>
        </div>
      </div>

      {/* Rate Info */}
      <p className="text-purple-300 text-sm mt-2">
        ₹{creator.callRate}/min • Cost: ₹{totalCost}
      </p>
    </div>
  )
}