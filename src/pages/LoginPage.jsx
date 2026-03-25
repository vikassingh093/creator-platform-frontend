import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated])

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
    <div className="min-h-screen bg-[#FFC629] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">⭐</span>
        </div>
        <h1 className="text-4xl font-extrabold text-[#1D1D1D]">CreatorHub</h1>
        <p className="text-[#1D1D1D] opacity-70 mt-2 font-medium">Connect with your favorite creators</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP}>
            <h2 className="text-2xl font-extrabold text-[#1D1D1D] mb-2">What's your number?</h2>
            <p className="text-[#757575] text-sm mb-6">We'll send you a verification code</p>
            <div className="mb-4">
              <div className="flex items-center bg-[#F8F8F8] rounded-2xl px-4 py-4 border-2 border-transparent focus-within:border-[#FFC629]">
                <span className="text-[#1D1D1D] font-bold mr-2">+91</span>
                <div className="w-px h-5 bg-gray-300 mr-3"></div>
                <input
                  type="tel"
                  placeholder="10 digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 bg-transparent text-[#1D1D1D] outline-none font-semibold text-lg"
                  maxLength={10}
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[#FFC629] hover:bg-[#FFA500] disabled:opacity-50 text-[#1D1D1D] font-extrabold py-4 rounded-2xl transition text-lg shadow-md">
              {loading ? '⏳ Sending...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <h2 className="text-2xl font-extrabold text-[#1D1D1D] mb-2">Enter the code</h2>
            <p className="text-[#757575] text-sm mb-6">
              Sent to +91 {phone} •
              <button type="button" onClick={() => { setStep('phone'); setError(''); setOtp('') }}
                className="text-[#FFA500] ml-1 font-bold underline">Change</button>
            </p>
            {mockOtp && (
              <div className="bg-[#FFF8E1] border-2 border-[#FFC629] rounded-2xl p-3 mb-4">
                <p className="text-[#1D1D1D] text-sm font-medium">
                  🔧 Mock OTP: <strong className="text-xl tracking-widest text-[#FFA500]">{mockOtp}</strong>
                </p>
              </div>
            )}
            <div className="mb-4">
              <input type="text" placeholder="000000" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-[#F8F8F8] border-2 border-transparent focus:border-[#FFC629] text-[#1D1D1D] rounded-2xl px-4 py-4 outline-none text-center text-3xl tracking-widest font-extrabold"
                maxLength={6} />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[#FFC629] hover:bg-[#FFA500] disabled:opacity-50 text-[#1D1D1D] font-extrabold py-4 rounded-2xl transition text-lg shadow-md">
              {loading ? '⏳ Verifying...' : 'Verify & Login ✓'}
            </button>
          </form>
        )}
      </div>
      <p className="text-[#1D1D1D] opacity-60 text-xs mt-6 text-center">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  )
}