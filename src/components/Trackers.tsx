import { useState } from 'react'
import { Camera, Check, Flame, Footprints, Plus, Utensils } from 'lucide-react'
import Bar from './Bar'
import {
  GOALS, KCAL_GOAL, SIZES, card, field, primary,
  type Food, type Size,
} from './data'

export function Calories({
  foods, setFoods, totalKcal, mealImage, setMealImage,
}: {
  foods: Food[]
  setFoods: (v: Food[]) => void
  totalKcal: number
  mealImage: string | null
  setMealImage: (v: string | null) => void
}) {
  const [name, setName] = useState('')
  const [kcalText, setKcalText] = useState('')
  const [meal, setMeal] = useState<Food['meal']>('Breakfast')
  const [proteinText, setProteinText] = useState('')
  const [fiberText, setFiberText] = useState('')
  const progress = Math.min(100, Math.round((totalKcal / KCAL_GOAL) * 100))
  const remaining = Math.max(0, KCAL_GOAL - totalKcal)
  const protein = foods.reduce((sum, food) => sum + (food.protein ?? 0), 0)
  const fiber = foods.reduce((sum, food) => sum + (food.fiber ?? 0), 0)

  const add = () => {
    const kcal = parseInt(kcalText, 10)
    if (!name.trim() || !Number.isFinite(kcal) || kcal <= 0) return
    setFoods([
      ...foods,
      {
        id: Date.now(),
        name: name.trim(),
        kcal,
        meal,
        protein: parseInt(proteinText, 10) || 0,
        fiber: parseInt(fiberText, 10) || 0,
      },
    ])
    setName('')
    setKcalText('')
    setProteinText('')
    setFiberText('')
  }

  const addQuickFood = (food: Pick<Food, 'name' | 'kcal' | 'meal'>) =>
    setFoods([...foods, { ...food, id: Date.now() }])

  const updateImage = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setMealImage(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-[#f5f3ed] shadow-sm">
        <div className="grid grid-cols-[1fr_112px] items-center gap-3 p-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e66c52]">
              Today&apos;s nutrition
            </span>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[#5d43d6]">
              Fuel your<br />good days.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#687773]">
              {remaining > 0 ? `${remaining.toLocaleString()} kcal left for today` : 'Daily goal reached'}
            </p>
          </div>
          <label className="group relative block h-28 w-28 cursor-pointer overflow-hidden rounded-[26px] bg-[#f9ddd4]">
            {mealImage ? (
              <img src={mealImage} alt="Your meal" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-[#d65d46]">
                <Utensils size={32} strokeWidth={1.6} />
                <span className="mt-1 text-[10px] font-bold">ADD PHOTO</span>
              </div>
            )}
            <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-full bg-white/90 py-1 text-[10px] font-bold text-[#5d43d6] opacity-0 transition group-hover:opacity-100">
              <Camera size={12} /> Update
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => updateImage(e.target.files?.[0])} />
          </label>
        </div>
        <div className="h-2 bg-[#eadfd9]">
          <div className="h-full rounded-r-full bg-[#e66c52] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#f9ddd4] p-3 text-[#d65d46]">
          <Flame size={18} />
          <p className="mt-2 text-xl font-black">{totalKcal}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide">Calories</p>
        </div>
        <div className="rounded-2xl bg-[#d8e8db] p-3 text-[#287354]">
          <p className="text-xl font-black">{protein}g</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">Protein</p>
        </div>
        <div className="rounded-2xl bg-[#ded9eb] p-3 text-[#62558a]">
          <p className="text-xl font-black">{fiber}g</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">Fiber</p>
        </div>
      </div>

      <div className={`${card} space-y-2`}>
        <div className="mb-1 flex items-center justify-between">
          <p className="font-bold text-[#193c36]">Add what you ate</p>
          <span className="text-xs text-[#89928f]">Required: name + kcal</span>
        </div>
        <input
          className={field}
          placeholder="Food or meal (e.g. Oatmeal)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input className={field} placeholder="Calories" inputMode="numeric" value={kcalText} onChange={(e) => setKcalText(e.target.value.replace(/\D/g, ''))} />
          <select className={field} value={meal} onChange={(e) => setMeal(e.target.value as Food['meal'])}>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={field} placeholder="Protein (g)" inputMode="numeric" value={proteinText} onChange={(e) => setProteinText(e.target.value.replace(/\D/g, ''))} />
          <input className={field} placeholder="Fiber (g)" inputMode="numeric" value={fiberText} onChange={(e) => setFiberText(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d43d6] py-2.5 font-semibold text-white hover:bg-[#4c35bd]"
          onClick={add}
        >
          <Plus size={17} /> Log meal
        </button>
      </div>

      <div className={`${card} space-y-3`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[#193c36]">Today&apos;s meals</p>
            <p className="text-xs text-[#89928f]">{foods.length} {foods.length === 1 ? 'item' : 'items'} logged</p>
          </div>
          <span className="rounded-full bg-[#ecffd2] px-3 py-1 text-xs font-bold text-[#287354]">{progress}% of goal</span>
        </div>
        {foods.length === 0 && (
          <div className="rounded-xl bg-[#f5f3ed] p-4 text-center">
            <p className="text-sm text-[#687773]">Nothing logged yet.</p>
            <p className="mt-1 text-xs text-[#89928f]">Start with one meal—small moves count.</p>
          </div>
        )}
        {foods.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-3 border-t border-[#e5e6df] py-2 text-sm first:border-t-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f6df9a] text-[#725a17]">
                <Utensils size={16} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[#193c36]">{f.name}</strong>
                <small className="text-xs text-[#89928f]">{f.meal ?? 'Meal'}{f.protein ? ` · ${f.protein}g protein` : ''}</small>
              </span>
            </div>
            <span className="shrink-0 font-bold text-[#d65d46]">{f.kcal} kcal</span>
            <button
              aria-label={`Remove ${f.name}`}
              className="shrink-0 text-xs text-[#89928f] hover:text-[#d65d46]"
              onClick={() => setFoods(foods.filter((x) => x.id !== f.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#d8e8db] p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#287354]">Quick add</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { name: 'Apple', kcal: 95, meal: 'Snack' as const },
            { name: 'Oatmeal', kcal: 180, meal: 'Breakfast' as const },
            { name: 'Yogurt', kcal: 120, meal: 'Snack' as const },
          ].map((food) => (
            <button key={food.name} onClick={() => addQuickFood(food)} className="rounded-xl bg-white/75 px-2 py-2 text-xs font-semibold text-[#193c36] hover:bg-white">
              <Check className="mx-auto mb-1 text-[#287354]" size={14} />{food.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Steps({
  steps, setSteps, goal,
}: {
  steps: number
  setSteps: (v: number) => void
  goal: number
}) {
  const [customSteps, setCustomSteps] = useState('')
  const progress = goal > 0 ? Math.min(100, Math.round((steps / goal) * 100)) : 0
  const remaining = Math.max(0, goal - steps)

  const addSteps = (amount: number) => setSteps(Math.max(0, steps + amount))
  const saveCustomSteps = () => {
    const next = parseInt(customSteps, 10)
    if (!Number.isFinite(next) || next < 0) return
    setSteps(next)
    setCustomSteps('')
  }

  return (
    <div className="space-y-4">
      <div className={`${card} bg-[#d8e8db] text-center`}>
        <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-[#ecffd2] bg-[#fbfbf7]">
          <Footprints className="mb-1 text-[#287354]" />
          <span className="text-2xl font-black text-[#193c36]">{steps.toLocaleString()}</span>
          <span className="text-xs text-[#687773]">Steps today</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-[#193c36]">{progress}%</p>
        <p className="text-xs text-[#687773]">
          {remaining > 0 ? `${remaining.toLocaleString()} steps to go` : 'Daily goal complete'}
        </p>
      </div>

      <div className={`${card} space-y-3`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#193c36]">Daily progress</span>
          <span className="text-[#89928f]">{steps.toLocaleString()} / {goal.toLocaleString()}</span>
        </div>
        <Bar value={steps} goal={goal} />
        <div className="flex gap-2">
          <button className={`${primary} flex-1`} onClick={() => addSteps(500)}>+500</button>
          <button className={`${primary} flex-1`} onClick={() => addSteps(1000)}>+1,000</button>
        </div>
        <div className="flex gap-2">
          <input
            className={field}
            inputMode="numeric"
            placeholder="Set exact total"
            value={customSteps}
            onChange={(e) => setCustomSteps(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveCustomSteps()
            }}
          />
          <button className="rounded-xl bg-[#f6df9a] px-4 py-2 text-sm font-medium text-[#725a17]" onClick={saveCustomSteps}>
            Set
          </button>
        </div>
        <button
          className="w-full rounded-xl bg-[#f5f3ed] py-2 text-sm text-[#687773]"
          onClick={() => setSteps(0)}
        >
          Reset today&apos;s steps
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
    <div className={`${card} space-y-3 bg-[#f6df9a]`}>
      <p className="font-bold text-[#193c36]">Daily step goal</p>
      <div className="grid grid-cols-4 gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`rounded-xl py-2 text-sm ${goal === g ? 'bg-[#5d43d6] text-white' : 'bg-white/70 text-[#193c36]'}`}
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
    <div className={`${card} space-y-3 bg-[#ded9eb]`}>
      <p className="font-bold text-[#193c36]">Text size</p>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SIZES) as Size[]).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`rounded-xl py-2 text-sm capitalize ${size === s ? 'bg-[#5d43d6] text-white' : 'bg-white/70 text-[#193c36]'}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}