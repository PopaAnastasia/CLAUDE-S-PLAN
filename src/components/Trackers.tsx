import { useState } from 'react'
import { Footprints } from 'lucide-react'
import Bar from './Bar'
import {
  GOALS, KCAL_GOAL, SIZES, card, field, primary,
  type Food, type Size,
} from './data'

export function Calories({
  foods, setFoods, totalKcal,
}: {
  foods: Food[]
  setFoods: (v: Food[]) => void
  totalKcal: number
}) {
  const [name, setName] = useState('')
  const [kcalText, setKcalText] = useState('')

  const add = () => {
    const kcal = parseInt(kcalText, 10)
    if (!name.trim() || !Number.isFinite(kcal) || kcal <= 0) return
    setFoods([...foods, { id: Date.now(), name: name.trim(), kcal }])
    setName('')
    setKcalText('')
  }

  return (
    <>
      <div className={`${card} text-center`}>
        <span className="text-3xl font-extrabold text-orange-600">{totalKcal}</span>
        <p className="text-xs text-slate-400">
          Calories consumed today (goal: {KCAL_GOAL})
        </p>
      </div>
      <div className={`${card} space-y-2`}>
        <input
          className={field}
          placeholder="Food (e.g. Oatmeal)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={field}
          placeholder="Calories"
          inputMode="numeric"
          value={kcalText}
          onChange={(e) => setKcalText(e.target.value.replace(/\D/g, ''))}
        />
        <button
          className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white"
          onClick={add}
        >
          + Log meal / food
        </button>
      </div>
      <div className={card}>
        {foods.length === 0 && (
          <p className="text-sm text-slate-400">Nothing logged yet.</p>
        )}
        {foods.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between border-t border-slate-50 py-2 text-sm first:border-t-0"
          >
            <span>{f.name} · {f.kcal} kcal</span>
            <button
              className="text-slate-400"
              onClick={() => setFoods(foods.filter((x) => x.id !== f.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export function Steps({
  steps, setSteps, goal,
}: {
  steps: number
  setSteps: (v: number) => void
  goal: number
}) {
  return (
    <div className="space-y-4 py-4 text-center">
      <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-indigo-100 bg-indigo-50">
        <Footprints className="mb-1 text-indigo-600" />
        <span className="text-2xl font-black text-indigo-700">{steps.toLocaleString()}</span>
        <span className="text-xs text-slate-400">Steps</span>
      </div>
      <Bar value={steps} goal={goal} />
      <p className="text-sm text-slate-500">Goal: {goal.toLocaleString()} steps</p>
      <div className="flex gap-2">
        <button className={`${primary} flex-1`} onClick={() => setSteps(steps + 500)}>+500</button>
        <button className={`${primary} flex-1`} onClick={() => setSteps(steps + 1000)}>+1000</button>
        <button
          className="flex-1 rounded-lg bg-slate-200 py-2 text-sm text-slate-700"
          onClick={() => setSteps(0)}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export function SettingsPage({
  goal, setGoal,
}: {
  goal: number
  setGoal: (v: number) => void
}) {
  return (
    <div className={`${card} space-y-3`}>
      <p className="font-bold text-slate-700">Daily step goal</p>
      <div className="grid grid-cols-4 gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`rounded-lg py-2 text-sm ${goal === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {g.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  )
}

export function FontsPage({
  size, setSize,
}: {
  size: Size
  setSize: (v: Size) => void
}) {
  return (
    <div className={`${card} space-y-3`}>
      <p className="font-bold text-slate-700">Text size</p>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SIZES) as Size[]).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`rounded-lg py-2 text-sm capitalize ${size === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}