export default function AudioCall({ creator, duration, formatDuration, totalCost }) {
  return (
    <div className="flex flex-col items-center">
      {/* Creator Photo */}
      <div className="relative mb-6">
        <img
          src={creator.photo}
          alt={creator.name}
          className="w-40 h-40 rounded-full object-cover border-4 border-purple-400 shadow-2xl"
        />
        {/* Sound Wave Animation */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 items-end">
          {[1,2,3,4,5].map(i => (
            <div
              key={i}
              className="w-1 bg-green-400 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 100}ms`
              }}
            ></div>
          ))}
        </div>
      </div>

      <h1 className="text-white text-3xl font-bold mb-1 mt-6">{creator.name}</h1>
      <p className="text-purple-300 text-sm mb-4">{creator.specialty}</p>
      <p className="text-green-400 font-semibold mb-2">🎙️ Audio Call Connected</p>
      <p className="text-white text-4xl font-bold font-mono">{formatDuration(duration)}</p>
      <p className="text-purple-300 text-sm mt-2">
        ₹{creator.callRate}/min • Cost: ₹{totalCost}
      </p>
    </div>
  )
}