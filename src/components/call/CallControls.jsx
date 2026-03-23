export default function CallControls({
  callType,
  isMuted,
  isSpeakerOn,
  isVideoOn,
  onMuteToggle,
  onSpeakerToggle,
  onVideoToggle,
  onEndCall,
}) {
  return (
    <div className="w-full">
      {/* Main Controls */}
      <div className="flex justify-center items-center gap-6 mb-4">
        {/* Mute Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onMuteToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
              isMuted
                ? 'bg-red-500 text-white'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            <span className="text-2xl">{isMuted ? '🔇' : '🎙️'}</span>
          </button>
          <p className="text-white text-xs">{isMuted ? 'Unmute' : 'Mute'}</p>
        </div>

        {/* End Call Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onEndCall}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-xl"
          >
            <span className="text-3xl">📵</span>
          </button>
          <p className="text-white text-xs">End Call</p>
        </div>

        {/* Speaker Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onSpeakerToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
              !isSpeakerOn
                ? 'bg-red-500 text-white'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            <span className="text-2xl">{isSpeakerOn ? '🔊' : '🔈'}</span>
          </button>
          <p className="text-white text-xs">Speaker</p>
        </div>
      </div>

      {/* Video Controls */}
      {callType === 'video' && (
        <div className="flex justify-center gap-6 mb-4">
          {/* Video Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onVideoToggle}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                !isVideoOn
                  ? 'bg-red-500 text-white'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              <span className="text-2xl">{isVideoOn ? '📹' : '📷'}</span>
            </button>
            <p className="text-white text-xs">{isVideoOn ? 'Camera Off' : 'Camera On'}</p>
          </div>

          {/* Flip Camera */}
          <div className="flex flex-col items-center gap-1">
            <button className="w-14 h-14 rounded-full bg-white bg-opacity-20 text-white flex items-center justify-center hover:bg-opacity-30 transition shadow-lg">
              <span className="text-2xl">🔄</span>
            </button>
            <p className="text-white text-xs">Flip</p>
          </div>
        </div>
      )}
    </div>
  )
}