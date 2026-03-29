export default function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${styles[status] || styles.pending}`}>
      {(status || 'pending').toUpperCase()}
    </span>
  )
}