import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockCreators, mockUser } from '../utils/mockData'
import AudioCall from '../components/call/AudioCall'
import VideoCall from '../components/call/VideoCall'
import CallControls from '../components/call/CallControls'
import CallStatus from '../components/call/CallStatus'

export default function CallPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const creator = mockCreators.find(c => c.id === parseInt(id))

  const [callStatus, setCallStatus] = useState('calling')
  const [callType, setCallType] = useState('audio')
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [totalCost, setTotalCost] = useState(0)
  const [walletBalance] = useState(mockUser.walletBalance)

  // Auto connect after 3 seconds
  useEffect(() => {
    if (callStatus === 'calling') {
      const timer = setTimeout(() => {
        setCallStatus('connected')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [callStatus])

  // Timer & cost calculation
  useEffect(() => {
    let interval
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          setTotalCost(Math.floor(newDuration / 60) * creator.callRate)
          return newDuration
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    setCallStatus('ended')
    setTimeout(() => navigate(-1), 3000)
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Creator not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col p-6">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        {/* Call Type Toggle - Only show when connected */}
        {callStatus === 'connected' && (
          <div className="flex gap-2 bg-white bg-opacity-10 p-1 rounded-2xl">
            <button
              onClick={() => setCallType('audio')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                callType === 'audio'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              🎙️ Audio
            </button>
            <button
              onClick={() => setCallType('video')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                callType === 'video'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              📹 Video
            </button>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="ml-auto bg-white bg-opacity-10 px-4 py-2 rounded-2xl">
          <p className="text-white text-sm font-semibold">
            💰 ₹{walletBalance - totalCost}
          </p>
        </div>
      </div>

      {/* Middle - Call Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Calling or Ended Status */}
        {(callStatus === 'calling' || callStatus === 'ended') && (
          <CallStatus
            callStatus={callStatus}
            creator={creator}
            duration={duration}
            formatDuration={formatDuration}
            totalCost={totalCost}
          />
        )}

        {/* Connected - Audio or Video */}
        {callStatus === 'connected' && callType === 'audio' && (
          <AudioCall
            creator={creator}
            duration={duration}
            formatDuration={formatDuration}
            totalCost={totalCost}
          />
        )}

        {callStatus === 'connected' && callType === 'video' && (
          <VideoCall
            creator={creator}
            duration={duration}
            formatDuration={formatDuration}
            totalCost={totalCost}
            isVideoOn={isVideoOn}
          />
        )}
      </div>

      {/* Bottom - Call Controls */}
      {callStatus === 'connected' && (
        <CallControls
          callType={callType}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          isVideoOn={isVideoOn}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onSpeakerToggle={() => setIsSpeakerOn(!isSpeakerOn)}
          onVideoToggle={() => setIsVideoOn(!isVideoOn)}
          onEndCall={handleEndCall}
        />
      )}

      {/* Calling - Only End Call Button */}
      {callStatus === 'calling' && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleEndCall}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-xl"
          >
            <span className="text-3xl">📵</span>
          </button>
          <p className="text-white text-xs">Cancel</p>
        </div>
      )}

      {/* Low Balance Warning */}
      {walletBalance - totalCost < 100 && callStatus === 'connected' && (
        <div className="bg-red-500 bg-opacity-80 text-white text-center py-2 px-4 rounded-2xl mt-4">
          ⚠️ Low balance! Add money to continue
        </div>
      )}
    </div>
  )
}