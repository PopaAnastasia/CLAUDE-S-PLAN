import { Dumbbell, Flame } from 'lucide-react'
import Bar from './Bar'
import {
  KCAL_GOAL, WORKOUTS, card, primary,
  type Log, type Page, type Workout,
} from './data'

export function Dashboard({
  steps, goal, burned, totalKcal, logs, go,
}: {
  steps: number
  goal: number
  burned: number
  totalKcal: number
  logs: Log[]
  go: (p: Page) => void
}) {
  return (
    <>
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-md">
        <p className="text-sm uppercase tracking-wider opacity-80">Today&apos;s progress</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-4xl font-extrabold">{steps.toLocaleString()}</span>
            <span className="text-sm opacity-90"> / {goal.toLocaleString()} steps</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold">{burned}</span>
            <span className="block text-xs opacity-90">Kcal burned</span>
          </div>
        </div>
        <div className="mt-4">
          <Bar value={steps} goal={goal} light />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => go('workouts')} className={`${card} text-left`}>
          <Dumbbell className="mb-2 text-indigo-600" />
          <p className="font-bold text-slate-700">Workouts</p>
          <p className="text-xs text-slate-400">{logs.length} logged</p>
        </button>
        <button onClick={() => go('calories')} className={`${card} text-left`}>
          <Flame className="mb-2 text-orange-500" />
          <p className="font-bold text-slate-700">Calorie Tracker</p>
          <p className="text-xs text-slate-400">{totalKcal} / {KCAL_GOAL} kcal</p>
        </button>
      </div>

      <div className={card}>
        <p className="mb-2 font-bold text-slate-700">Recent activity</p>
        {logs.length === 0 && (
          <p className="text-sm text-slate-400">No activity logged yet.</p>
        )}
        {logs.slice(0, 3).map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between border-t border-slate-50 py-2 text-sm"
          >
            <div>
              <p className="font-semibold text-slate-700">{l.name}</p>
              <p className="text-xs text-slate-400">{l.mins} mins · {l.kcal} kcal</p>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(l.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export function Workouts({ onLog }: { onLog: (w: Workout) => void }) {
  return (
    <>
      <h2 className="text-xl font-bold">Workout library</h2>
      {WORKOUTS.map((w) => (
        <div key={w.name} className={card}>
          <p className="font-bold text-slate-700">{w.name}</p>
          <p className="mt-1 text-xs text-slate-400">{w.note}</p>
          <p className="mt-1 text-xs text-slate-500">{w.mins} mins · {w.kcal} kcal</p>
          <button onClick={() => onLog(w)} className={`${primary} mt-3 w-full`}>
            Log workout
          </button>
        </div>
      ))}
    </>
  )
}