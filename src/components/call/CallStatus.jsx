export default function CallStatus({ callStatus, creator, duration, formatDuration, totalCost }) {
  if (callStatus === 'calling') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <img
            src={creator.photo}
            alt={creator.name}
            className="w-40 h-40 rounded-full object-cover border-4 border-purple-400 shadow-2xl"
          />
          <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-50"></div>
          <div className="absolute -inset-3 rounded-full border-2 border-purple-300 animate-ping opacity-30"></div>
        </div>
        <h1 className="text-white text-3xl font-bold mb-1">{creator.name}</h1>
        <p className="text-purple-300 text-sm mb-6">{creator.specialty}</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 150, 300].map(delay => (
              <div
                key={delay}
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              ></div>
            ))}
          </div>
          <p className="text-white text-lg ml-2">Calling...</p>
        </div>
      </div>
    )
  }

  if (callStatus === 'ended') {
    return (
      <div className="flex flex-col items-center">
        <img
          src={creator.photo}
          alt={creator.name}
          className="w-40 h-40 rounded-full object-cover border-4 border-red-400 shadow-2xl mb-6 opacity-75"
        />
        <h1 className="text-white text-3xl font-bold mb-2">{creator.name}</h1>
        <p className="text-red-400 font-bold text-xl mb-2">Call Ended 📵</p>
        <p className="text-white text-lg">Duration: {formatDuration(duration)}</p>
        <p className="text-purple-300 mt-1">Total Cost: ₹{totalCost}</p>
        <div className="bg-white bg-opacity-10 rounded-2xl p-4 mt-4 text-center">
          <p className="text-white font-semibold">Call Summary</p>
          <p className="text-purple-300 text-sm mt-1">Duration: {formatDuration(duration)}</p>
          <p className="text-purple-300 text-sm">Rate: ₹{creator.callRate}/min</p>
          <p className="text-green-400 font-bold mt-1">Total: ₹{totalCost}</p>
        </div>
        <p className="text-gray-400 text-sm mt-4 animate-pulse">Redirecting...</p>
      </div>
    )
  }

  return null
}