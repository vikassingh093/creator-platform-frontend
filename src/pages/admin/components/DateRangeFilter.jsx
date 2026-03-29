import { useState } from 'react'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7days', label: '7 Days' },
  { key: '30days', label: '30 Days' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
]

function getDateRange(preset) {
  const today = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) }
    case '7days': {
      const d = new Date(); d.setDate(d.getDate() - 7)
      return { from: fmt(d), to: fmt(today) }
    }
    case '30days': {
      const d = new Date(); d.setDate(d.getDate() - 30)
      return { from: fmt(d), to: fmt(today) }
    }
    case 'all':
      return { from: null, to: null }
    default:
      return { from: null, to: null }
  }
}

export default function DateRangeFilter({ onFilterChange }) {
  const [active, setActive] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const handlePreset = (key) => {
    setActive(key)
    if (key !== 'custom') {
      const range = getDateRange(key)
      onFilterChange(range.from, range.to)
    }
  }

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onFilterChange(customFrom, customTo)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              active === p.key
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {active === 'custom' && (
        <div className="flex gap-2 mt-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">FROM</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-violet-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">TO</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-violet-500"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-600 transition"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}