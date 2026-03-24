import { useState } from 'react'
import { creatorsAPI } from '../api/creators'

export default function RatingModal({ creatorId, creatorName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setLoading(true)
    setError('')
    try {
      await creatorsAPI.submitReview(creatorId, rating, comment)
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-8">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">⭐</p>
          <h2 className="text-lg font-bold text-gray-800">Rate {creatorName}</h2>
          <p className="text-gray-400 text-sm mt-1">How was your experience?</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              <span className={star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Rating Label */}
        {(hovered || rating) > 0 && (
          <p className="text-center text-sm font-semibold text-pink-600 mb-4">
            {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😊', 'Excellent 🤩'][hovered || rating]}
          </p>
        )}

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review (optional)..."
          rows={3}
          className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none text-gray-800 resize-none mb-4"
        />

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit ⭐'}
          </button>
        </div>
      </div>
    </div>
  )
}