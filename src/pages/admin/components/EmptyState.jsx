export default function EmptyState({ icon = '📭', message = 'No data found' }) {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-3">{icon}</p>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  )
}