import { Check, Dumbbell, Flame, Search } from 'lucide-react'
import { useState } from 'react'
import Bar from './Bar'
import {
  KCAL_GOAL, WORKOUTS, card, field, primary,
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
      <div className="rounded-2xl bg-[#5d43d6] p-5 text-white shadow-md">
        <p className="text-sm uppercase tracking-wider text-[#ded9eb]">Today&apos;s progress</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-4xl font-extrabold">{steps.toLocaleString()}</span>
            <span className="text-sm text-[#ded9eb]"> / {goal.toLocaleString()} steps</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold">{burned}</span>
            <span className="block text-xs text-[#ded9eb]">Kcal burned</span>
          </div>
        </div>
        <div className="mt-4">
          <Bar value={steps} goal={goal} light />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => go('workouts')} className={`${card} text-left`}>
          <Dumbbell className="mb-2 text-[#e66c52]" />
          <p className="font-bold text-[#193c36]">Workouts</p>
          <p className="text-xs text-[#89928f]">{logs.length} logged</p>
        </button>
        <button onClick={() => go('calories')} className={`${card} text-left`}>
          <Flame className="mb-2 text-[#e66c52]" />
          <p className="font-bold text-[#193c36]">Calorie Tracker</p>
          <p className="text-xs text-[#89928f]">{totalKcal} / {KCAL_GOAL} kcal</p>
        </button>
      </div>

      <div className={card}>
        <p className="mb-2 font-bold text-[#193c36]">Recent activity</p>
        {logs.length === 0 && (
          <p className="text-sm text-[#89928f]">No activity logged yet.</p>
        )}
        {logs.slice(0, 3).map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between border-t border-[#e5e6df] py-2 text-sm"
          >
            <div>
              <p className="font-semibold text-[#193c36]">{l.name}</p>
              <p className="text-xs text-[#89928f]">{l.mins} mins · {l.kcal} kcal</p>
            </div>
            <span className="text-xs text-[#89928f]">
              {new Date(l.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export function Workouts({ onLog }: { onLog: (w: Workout) => void }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [logged, setLogged] = useState<string | null>(null)
  const types = ['All', ...new Set(WORKOUTS.map((w) => w.type))]
  const visibleWorkouts = WORKOUTS.filter((w) =>
    (filter === 'All' || w.type === filter) &&
    w.name.toLowerCase().includes(query.toLowerCase()),
  )

  const log = (w: Workout) => {
    onLog(w)
    setLogged(w.name)
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-[#5d43d6]">Workout library</h2>
        <p className="mt-1 text-sm text-[#687773]">Find a session and keep your activity streak moving.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          className={`${field} pl-10`}
          placeholder="Search workouts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${filter === type ? 'bg-[#5d43d6] text-white' : 'bg-white text-[#687773] shadow-sm'}`}
          >
            {type}
          </button>
        ))}
      </div>
      {logged && (
        <div className="flex items-center gap-2 rounded-xl bg-[#d8e8db] p-3 text-sm text-[#287354]">
          <Check size={18} />
          <span><strong>{logged}</strong> added to today&apos;s activity.</span>
        </div>
      )}
      {visibleWorkouts.length === 0 && (
        <div className={card}>
          <p className="text-sm text-[#687773]">No workouts match that search.</p>
        </div>
      )}
      {visibleWorkouts.map((w) => (
        <div key={w.name} className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#193c36]">{w.name}</p>
              <p className="mt-1 text-xs font-medium text-[#e66c52]">{w.type}</p>
            </div>
            <span className="rounded-full bg-[#f5f3ed] px-2 py-1 text-xs text-[#687773]">{w.mins} min</span>
          </div>
          <p className="mt-1 text-xs text-[#89928f]">{w.note}</p>
          <p className="mt-2 text-xs text-[#687773]">{w.kcal} kcal estimate</p>
          <button onClick={() => log(w)} className={`${primary} mt-3 w-full`}>
            Log workout
          </button>
        </div>
      ))}
    </>
  )
}