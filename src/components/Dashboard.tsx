import { Check, Dumbbell, Flame, Footprints, Lightbulb, Search } from 'lucide-react'
import { useState } from 'react'
import Bar from './Bar'
import {
  WORKOUTS, card, field, primary,
  type Log, type Page, type Workout,
} from './data'

const TIPS = [
  'Short walks after meals add up. Ten minutes is a great start.',
  'Drink a glass of water before your workout to stay energized.',
  'Rest days count too. Recovery is part of getting stronger.',
  'Stretch for five minutes after sitting for a long time.',
  'Consistency beats intensity. Show up a little every day.',
  'Take the stairs when you can. Every step moves your goal.',
  'A good night of sleep makes tomorrow\'s workout easier.',
]

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function Dashboard({
  name, steps, goal, burned, totalKcal, logs, go,
}: {
  name: string
  steps: number
  goal: number
  burned: number
  totalKcal: number
  logs: Log[]
  go: (p: Page) => void
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((steps / goal) * 100)) : 0
  const today = new Date()
  const tip = TIPS[today.getDay() % TIPS.length]
  const tiles = [
    { page: 'steps' as Page, Icon: Footprints, label: 'Steps', value: `${pct}%`, tint: 'bg-[#d8e8db]', color: 'text-[#287354]' },
    { page: 'calories' as Page, Icon: Flame, label: 'Eaten', value: `${totalKcal}`, tint: 'bg-[#f9ddd4]', color: 'text-[#d65d46]' },
    { page: 'workouts' as Page, Icon: Dumbbell, label: 'Workouts', value: `${logs.length}`, tint: 'bg-[#ded9eb]', color: 'text-[var(--fit-accent)]' },
  ]
  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#89928f]">
          {today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-2xl font-bold text-[#193c36]">
          {greeting()}{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-[var(--fit-accent)] p-5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Today&apos;s progress</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-4xl font-extrabold">{steps.toLocaleString()}</span>
            <span className="text-sm text-white/75"> / {goal.toLocaleString()} steps</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold">{burned}</span>
            <span className="block text-xs text-white/75">kcal burned</span>
          </div>
        </div>
        <div className="mt-4">
          <Bar value={steps} goal={goal} light />
        </div>
        <p className="mt-2 text-xs text-white/80">
          {pct >= 100 ? 'Goal reached. Nice work!' : `${(goal - steps).toLocaleString()} steps to reach your goal`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tiles.map(({ page, Icon, label, value, tint, color }) => (
          <button key={label} onClick={() => go(page)} className={`rounded-2xl ${tint} p-3 text-left`}>
            <Icon size={18} className={color} />
            <p className="mt-2 text-xl font-extrabold text-[#193c36]">{value}</p>
            <p className="text-[11px] font-semibold text-[#687773]">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 rounded-2xl bg-[#f6df9a] p-4">
        <Lightbulb size={20} className="mt-0.5 shrink-0 text-[#725a17]" />
        <div>
          <p className="text-sm font-bold text-[#193c36]">Tip of the day</p>
          <p className="text-xs text-[#725a17]">{tip}</p>
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold text-[#193c36]">Recent activity</p>
          <button onClick={() => go('workouts')} className="text-xs font-semibold text-[var(--fit-accent)]">
            Log a workout
          </button>
        </div>
        {logs.length === 0 && (
          <p className="rounded-xl bg-[#f5f3ed] p-4 text-center text-sm text-[#89928f]">
            No activity logged yet. Pick a session from Workouts to get started.
          </p>
        )}
        {logs.slice(0, 3).map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 border-t border-[#e5e6df] py-2.5 text-sm first-of-type:border-t-0"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f9ddd4]">
              <Dumbbell size={16} className="text-[#e66c52]" />
            </span>
            <div className="flex-1">
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
        <h2 className="text-xl font-bold text-[var(--fit-accent)]">Workout library</h2>
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
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${filter === type ? 'bg-[var(--fit-accent)] text-white' : 'bg-white text-[#687773] shadow-sm'}`}
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