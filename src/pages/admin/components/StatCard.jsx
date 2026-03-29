export default function StatCard({ icon, label, value, subValue, color = 'text-violet-400', bgColor = 'bg-gray-900', span2 = false }) {
  return (
    <div className={`${bgColor} rounded-2xl p-4 border border-gray-800 ${span2 ? 'col-span-2' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
          <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
          {subValue && <p className="text-gray-600 text-[10px] mt-0.5">{subValue}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}