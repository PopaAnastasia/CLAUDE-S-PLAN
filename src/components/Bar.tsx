export default function Bar({
  value,
  goal,
  light,
}: {
  value: number
  goal: number
  light?: boolean
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${light ? 'bg-white/30' : 'bg-slate-200'}`}>
      <div
        className={`h-2 rounded-full ${light ? 'bg-white' : 'bg-indigo-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}