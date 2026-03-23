import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mockOtp, setMockOtp] = useState('')

  // Already logged in - redirect to home
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Enter valid 10 digit phone number')
      return
    }

    setLoading(true)
    try {
      const data = await authAPI.sendOTP(phone)
      setMockOtp(data.mock_otp)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Enter valid 6 digit OTP')
      return
    }

    setLoading(true)
    try {
      const data = await authAPI.verifyOTP(phone, otp)
      setAuth(data.user, data.access_token, data.refresh_token)

      // Redirect based on user type
      if (data.user.user_type === 'admin') {
        navigate('/admin', { replace: true })
      } else if (data.user.user_type === 'creator') {
        navigate('/creator-dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Creator<span className="text-pink-500">Hub</span>
          </h1>
          <p className="text-gray-400 mt-2">Connect with your favorite creators</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP}>
              <h2 className="text-xl font-semibold text-white mb-6">
                Enter Phone Number
              </h2>
              <div className="mb-4">
                <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-pink-500">
                  <span className="text-gray-400 mr-2">+91</span>
                  <input
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-transparent text-white outline-none"
                    maxLength={10}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <h2 className="text-xl font-semibold text-white mb-2">
                Verify OTP
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                OTP sent to +91 {phone}
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); setOtp('') }}
                  className="text-pink-500 ml-2 underline"
                >
                  Change
                </button>
              </p>

              {/* Mock OTP - Remove in production */}
              {mockOtp && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-3 mb-4">
                  <p className="text-yellow-400 text-sm">
                    🔧 Mock OTP: <strong className="text-lg tracking-widest">{mockOtp}</strong>
                  </p>
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-pink-500 text-white rounded-xl px-4 py-3 outline-none text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}