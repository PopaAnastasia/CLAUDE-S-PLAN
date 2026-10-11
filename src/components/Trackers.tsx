import { useEffect, useState } from 'react'
import {
  Camera, Check, ChevronRight, CircleHelp, Download, Flame, Footprints, Mail, PersonStanding, Play, Plus, Share, Smartphone,
  Square, Target, Type, UserRound, Utensils,
  type LucideIcon,
} from 'lucide-react'
import Bar from './Bar'
import { useWalk } from '../lib/useWalk'
import {
  GOALS, KCAL_GOAL, SIZES, card, field, primary,
  type Food, type Page, type Size,
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
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[var(--fit-accent)]">
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
            <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-full bg-white/90 py-1 text-[10px] font-bold text-[var(--fit-accent)] opacity-0 transition group-hover:opacity-100">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--fit-accent)] py-2.5 font-semibold text-white hover:opacity-90"
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

const fmtClock = (ms: number) => {
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function WalkCard({ onSave }: { onSave: (n: number) => void }) {
  const walk = useWalk()
  const [elapsed, setElapsed] = useState(0)
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => {
    if (!walk.active || walk.startedAt === null) return
    const from = walk.startedAt
    const t = setInterval(() => setElapsed(Date.now() - from), 1000)
    return () => clearInterval(t)
  }, [walk.active, walk.startedAt])

  const finish = (save: boolean) => {
    const n = walk.stop()
    if (save && n > 0) onSave(n)
    setAdded(save ? n : null)
  }

  if (walk.active) {
    return (
      <div className="space-y-4 rounded-2xl bg-[#193c36] p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b9d3c4]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#9be29b]" /> Walk in progress
          </span>
          <span className="font-mono text-sm text-[#b9d3c4]">{fmtClock(elapsed)}</span>
        </div>
        <div className="text-center">
          <p className="text-5xl font-black tabular-nums">{walk.count.toLocaleString()}</p>
          <p className="text-sm text-[#b9d3c4]">steps this walk</p>
        </div>
        <p className="text-center text-xs text-[#b9d3c4]">Keep Shake open on screen while you walk.</p>
        <div className="flex gap-2">
          <button onClick={() => finish(false)} className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={() => finish(true)} className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-[#9be29b] py-2.5 text-sm font-bold text-[#193c36]">
            <Square size={14} /> Finish and add steps
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8e8db]">
          <PersonStanding size={20} className="text-[#287354]" />
        </span>
        <div>
          <p className="font-bold text-[#193c36]">Track a walk</p>
          <p className="text-xs text-[#687773]">Counts your steps live using your phone&apos;s motion sensor.</p>
        </div>
      </div>
      {added !== null && (
        <p className="flex items-center gap-2 rounded-xl bg-[#d8e8db] p-3 text-sm text-[#287354]">
          <Check size={16} />
          {added > 0 ? `${added.toLocaleString()} steps added to today.` : 'No steps were counted on that walk.'}
        </p>
      )}
      {walk.error && <p className="rounded-xl bg-[#fbe4df] p-3 text-xs text-[#a33b26]">{walk.error}</p>}
      <button onClick={() => { setAdded(null); setElapsed(0); void walk.start() }} className={`${primary} flex w-full items-center justify-center gap-2 py-2.5`}>
        <Play size={16} /> Start walk
      </button>
      <p className="text-[11px] text-[#89928f]">Keep the app open while you walk. Steps aren&apos;t counted in the background.</p>
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
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const progress = goal > 0 ? Math.min(100, Math.round((steps / goal) * 100)) : 0
  const remaining = Math.max(0, goal - steps)

  const addSteps = (n: number) => {
    setSteps(Math.max(0, steps + n))
    setNote(`Added ${n.toLocaleString()} steps.`)
  }
  const typed = parseInt(amount, 10)
  const valid = Number.isFinite(typed) && typed > 0 && typed <= 100000
  const addTyped = () => {
    if (!valid) return
    addSteps(typed)
    setAmount('')
  }
  const setTotal = () => {
    if (!Number.isFinite(typed) || typed < 0 || typed > 200000) return
    setSteps(typed)
    setNote(`Today's total set to ${typed.toLocaleString()} steps.`)
    setAmount('')
  }

  return (
    <div className="space-y-4">
      <div className={`${card} bg-[#d8e8db]! text-center`}>
        <div
          className="mx-auto grid h-40 w-40 place-items-center rounded-full p-2.5"
          style={{ background: `conic-gradient(#287354 ${progress * 3.6}deg, #ecffd2 0deg)` }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#fbfbf7]">
            <Footprints className="mb-1 text-[#287354]" />
            <span className="text-2xl font-black text-[#193c36]">{steps.toLocaleString()}</span>
            <span className="text-xs text-[#687773]">Steps today</span>
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-[#193c36]">{progress}%</p>
        <p className="text-xs text-[#687773]">
          {remaining > 0 ? `${remaining.toLocaleString()} steps to go` : 'Daily goal complete'}
        </p>
      </div>

      <WalkCard onSave={addSteps} />

      <div className={`${card} space-y-3`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#193c36]">Add steps</span>
          <span className="text-[#89928f]">{steps.toLocaleString()} / {goal.toLocaleString()}</span>
        </div>
        <Bar value={steps} goal={goal} />
        <div className="flex gap-2">
          <input
            className={field}
            inputMode="numeric"
            placeholder="Number of steps"
            aria-label="Number of steps"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTyped()
            }}
          />
          <button disabled={!valid} className={`${primary} flex items-center gap-1 disabled:opacity-50`} onClick={addTyped}>
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="flex gap-2">
          {[500, 1000, 2500].map((n) => (
            <button
              key={n}
              onClick={() => addSteps(n)}
              className="flex-1 rounded-xl bg-[#f5f3ed] py-2 text-sm font-semibold text-[#193c36] hover:bg-[#ecebe3]"
            >
              +{n.toLocaleString()}
            </button>
          ))}
        </div>
        {note && <p className="text-xs text-[#287354]">{note}</p>}
        <div className="flex gap-2 border-t border-[#e5e6df] pt-3">
          <button
            disabled={!amount}
            className="flex-1 rounded-xl bg-[#f6df9a] py-2 text-sm font-medium text-[#725a17] disabled:opacity-50"
            onClick={setTotal}
          >
            Set as today&apos;s total
          </button>
          <button
            className="flex-1 rounded-xl bg-[#f5f3ed] py-2 text-sm text-[#687773]"
            onClick={() => {
              setSteps(0)
              setNote('Today\'s steps were reset.')
            }}
          >
            Reset today
          </button>
        </div>
      </div>
    </div>
  )
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Shows how to put Shake on the home screen so it opens like a normal app.
// Hidden once the app is already installed.
function InstallCard() {
  const [installed, setInstalled] = useState(isInstalled)
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null
  const ios = isIOS()

  return (
    <div className={`${card} space-y-3 bg-[#ded9eb]!`}>
      <div className="flex items-center gap-2">
        <Smartphone size={18} className="text-[var(--fit-accent)]" />
        <p className="font-bold text-[#193c36]">Add Shake to your Home Screen</p>
      </div>
      <p className="text-xs text-[#687773]">
        Shake opens full screen like any other app, works offline, and gets its own icon.
      </p>
      {prompt ? (
        <button
          className={`${primary} flex w-full items-center justify-center gap-2`}
          onClick={async () => {
            await prompt.prompt()
            const r = await prompt.userChoice
            if (r.outcome === 'accepted') setInstalled(true)
            setPrompt(null)
          }}
        >
          <Download size={16} /> Install Shake
        </button>
      ) : ios ? (
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#193c36]">
          <li>Open this page in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> button <Share size={12} className="inline align-[-1px]" /> at the bottom of the screen.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          <li>Open Shake from its new icon.</li>
        </ol>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#193c36]">
          <li>Open this page in <strong>Chrome</strong>.</li>
          <li>Tap the <strong>⋮</strong> menu at the top right.</li>
          <li>Tap <strong>Add to Home screen</strong> (or <strong>Install app</strong>), then <strong>Install</strong>.</li>
          <li>Open Shake from its new icon.</li>
        </ol>
      )}
    </div>
  )
}

export function SettingsPage({
  goal, setGoal, go,
}: {
  goal: number
  setGoal: (v: number) => void
  go: (p: Page) => void
}) {
  const links: { id: Page; label: string; note: string; Icon: LucideIcon }[] = [
    { id: 'profile', label: 'Profile', note: 'Name, focus, app color and units', Icon: UserRound },
    { id: 'fonts', label: 'Text size', note: 'Make text easier to read', Icon: Type },
    { id: 'help', label: 'Help & Support', note: 'Answers to common questions', Icon: CircleHelp },
    { id: 'contact', label: 'Contact us', note: 'Get in touch with our team', Icon: Mail },
  ]
  return (
    <>
      <div className={`${card} space-y-3 bg-[#f6df9a]!`}>
        <div className="flex items-center gap-2">
          <Target size={18} className="text-[#725a17]" />
          <p className="font-bold text-[#193c36]">Daily step goal</p>
        </div>
        <p className="text-xs text-[#725a17]">Your Dashboard and Step Counter track progress toward this number.</p>
        <div className="grid grid-cols-4 gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`rounded-xl py-2 text-sm font-semibold ${goal === g ? 'bg-[var(--fit-accent)] text-white' : 'bg-white/70 text-[#193c36]'}`}
            >
              {g.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <InstallCard />

      <div className={`${card} p-2!`}>
        {links.map(({ id, label, note, Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[#f5f3ed]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f3ed]">
              <Icon size={18} className="text-[#e66c52]" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-[#193c36]">{label}</span>
              <span className="block text-xs text-[#89928f]">{note}</span>
            </span>
            <ChevronRight size={18} className="text-[#cdd2ce]" />
          </button>
        ))}
      </div>

      <div className="text-center text-xs text-[#89928f]">
        <p className="font-semibold text-[#687773]">Shake · Version 1.0</p>
        <p className="mt-0.5">No account needed. Your logs stay on this device.</p>
      </div>
    </>
  )
}

const SIZE_LABEL: Record<Size, string> = { small: 'Small', normal: 'Normal', large: 'Large' }

export function FontsPage({
  size, setSize,
}: {
  size: Size
  setSize: (v: Size) => void
}) {
  return (
    <>
      <div className={`${card} space-y-3 bg-[#ded9eb]!`}>
        <div className="flex items-center gap-2">
          <Type size={18} className="text-[var(--fit-accent)]" />
          <p className="font-bold text-[#193c36]">Text size</p>
        </div>
        <p className="text-xs text-[#687773]">Changes the size of text across the app.</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SIZES) as Size[]).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-sm font-semibold ${size === s ? 'bg-[var(--fit-accent)] text-white' : 'bg-white/70 text-[#193c36]'}`}
            >
              <span style={{ fontSize: SIZES[s] }} className="font-bold leading-none">Aa</span>
              <span className="text-xs">{SIZE_LABEL[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`${card} space-y-2`}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#89928f]">Preview</p>
        <p className="text-lg font-bold text-[#193c36]">Morning Run</p>
        <p className="text-sm text-[#687773]">30 min · 300 kcal · Easy pace, steady breathing.</p>
        <Bar value={4250} goal={10000} />
        <p className="text-xs text-[#89928f]">4,250 of 10,000 steps</p>
      </div>
    </>
  )
}
