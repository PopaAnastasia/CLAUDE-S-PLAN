import { useState } from 'react'
import { unlockVault, type VaultMode } from '../crypto/vault'

type Page = 'home' | 'calories' | 'steps' | 'meals' | 'help' | 'contact'
type Food = { id: number; name: string; kcal: number }

const STEP_GOAL = 10000
const KCAL_GOAL = 2000
const MIN_SEARCH_MS = 1500 // every search takes at least this long

const MENU: { id: Page; label: string }[] = [
  { id: 'home', label: 'Today' },
  { id: 'calories', label: 'Calorie tracker' },
  { id: 'steps', label: 'Step counter' },
  { id: 'meals', label: 'Meal plans' },
]

const PLANS = [
  { name: 'Balanced', kcal: 1800, note: 'Lean protein, whole grains, plenty of vegetables.' },
  { name: 'High protein', kcal: 2100, note: 'Eggs, chicken, yogurt and legumes at every meal.' },
  { name: 'Light & simple', kcal: 1500, note: 'Smaller portions, soups, salads and fruit.' },
]

// Saves ordinary fitness data (steps, meals) so the app feels real.
// Never store anything private here.
function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const save = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }
  return [value, save] as const
}

function Bar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div className="h-3 w-full rounded-full bg-slate-200">
      <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function FitnessApp({
  onResult,
}: {
  onResult: (mode: VaultMode | null) => void
}) {
  const [page, setPage] = useState<Page>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [steps, setSteps] = useStored<number>('fit.steps', 3200)
  const [foods, setFoods] = useStored<Food[]>('fit.foods', [])
  const [foodName, setFoodName] = useState('')
  const [foodKcal, setFoodKcal] = useState('')
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)

  const totalKcal = foods.reduce((s, f) => s + f.kcal, 0)
  const go = (p: Page) => {
    setPage(p)
    setMenuOpen(false)
  }

  const addFood = () => {
    const kcal = parseInt(foodKcal, 10)
    if (!foodName.trim() || !Number.isFinite(kcal) || kcal <= 0) return
    setFoods([...foods, { id: Date.now(), name: foodName.trim(), kcal }])
    setFoodName('')
    setFoodKcal('')
  }

  // Every question is checked against the vault. Real phrase -> real vault.
  // Decoy phrase or anything else -> the same FAQ page.
  const ask = async () => {
    if (busy || !question.trim()) return
    setBusy(true)
    const started = Date.now()
    let mode: VaultMode | null = null
    try {
      mode = await unlockVault(question)
    } catch {
      mode = null
    }
    const wait = Math.max(0, MIN_SEARCH_MS - (Date.now() - started))
    await new Promise((r) => setTimeout(r, wait))
    setQuestion('')
    setBusy(false)
    onResult(mode)
  }

  const card = 'rounded-2xl bg-white p-4 shadow-sm'
  const field = 'rounded-xl border border-slate-300 bg-white px-3 py-2'

  return (
    <div className="min-h-screen bg-slate-100 max-w-md mx-auto">
      <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button className="text-2xl text-slate-700" onClick={() => setMenuOpen(true)}
          aria-label="Menu">☰</button>
        <span className="font-semibold text-slate-800">Daily Fit</span>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-20 flex">
          <nav className="w-64 bg-white p-5 flex flex-col">
            <p className="mb-4 text-lg font-bold text-slate-800">Daily Fit</p>
            {MENU.map((m) => (
              <button key={m.id} onClick={() => go(m.id)}
                className="py-3 text-left text-slate-700">
                {m.label}
              </button>
            ))}
            <div className="mt-auto flex flex-col gap-1">
              <button onClick={() => go('help')} className="text-left text-xs text-slate-400">Help</button>
              <button onClick={() => go('contact')} className="text-left text-xs text-slate-400">Contact us</button>
            </div>
          </nav>
          <button className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)}
            aria-label="Close menu" />
        </div>
      )}

      <main className="space-y-4 p-4">
        {page === 'home' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Today</h1>
            <div className={card}>
              <p className="text-sm text-slate-500">Steps</p>
              <p className="mb-2 text-2xl font-semibold">{steps.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {STEP_GOAL.toLocaleString()}</span></p>
              <Bar value={steps} goal={STEP_GOAL} />
            </div>
            <div className={card}>
              <p className="text-sm text-slate-500">Calories eaten</p>
              <p className="mb-2 text-2xl font-semibold">{totalKcal} <span className="text-sm font-normal text-slate-400">/ {KCAL_GOAL} kcal</span></p>
              <Bar value={totalKcal} goal={KCAL_GOAL} />
            </div>
          </>
        )}

        {page === 'calories' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Calorie tracker</h1>
            <div className={`${card} space-y-2`}>
              <input className={`${field} w-full`} placeholder="Food (e.g. Oatmeal)"
                value={foodName} onChange={(e) => setFoodName(e.target.value)} />
              <input className={`${field} w-full`} placeholder="Calories" inputMode="numeric"
                value={foodKcal} onChange={(e) => setFoodKcal(e.target.value.replace(/\D/g, ''))} />
              <button className="w-full rounded-xl bg-emerald-600 py-2 text-white" onClick={addFood}>Add</button>
            </div>
            <div className={card}>
              <p className="mb-2 text-sm text-slate-500">Total: {totalKcal} / {KCAL_GOAL} kcal</p>
              {foods.length === 0 && <p className="text-sm text-slate-400">Nothing logged yet.</p>}
              {foods.map((f) => (
                <div key={f.id} className="flex items-center justify-between border-t border-slate-100 py-2 text-sm">
                  <span>{f.name} · {f.kcal} kcal</span>
                  <button className="text-slate-400" onClick={() => setFoods(foods.filter((x) => x.id !== f.id))}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}

        {page === 'steps' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Step counter</h1>
            <div className={card}>
              <p className="mb-2 text-3xl font-semibold">{steps.toLocaleString()}</p>
              <Bar value={steps} goal={STEP_GOAL} />
              <p className="mt-2 text-sm text-slate-500">Goal: {STEP_GOAL.toLocaleString()} steps</p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-xl bg-emerald-600 py-2 text-white" onClick={() => setSteps(steps + 500)}>+500</button>
                <button className="flex-1 rounded-xl bg-emerald-600 py-2 text-white" onClick={() => setSteps(steps + 1000)}>+1000</button>
                <button className="flex-1 rounded-xl bg-slate-200 py-2 text-slate-700" onClick={() => setSteps(0)}>Reset</button>
              </div>
            </div>
          </>
        )}

        {page === 'meals' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Meal plans</h1>
            {PLANS.map((p) => (
              <div key={p.name} className={card}>
                <p className="font-semibold text-slate-800">{p.name} · {p.kcal} kcal</p>
                <p className="text-sm text-slate-500">{p.note}</p>
              </div>
            ))}
          </>
        )}

        {page === 'help' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Help Center</h1>
            <div className={`${card} space-y-3`}>
              <p className="text-sm text-slate-600">Ask a question or search our help articles.</p>
              <input
                className={`${field} w-full`}
                placeholder="Type your question"
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') ask() }}
              />
              <button disabled={busy} onClick={ask}
                className="w-full rounded-xl bg-emerald-600 py-2 text-white disabled:opacity-60">
                {busy ? 'Searching…' : 'Search'}
              </button>
            </div>
            <div className={card}>
              <p className="mb-1 text-sm font-medium text-slate-700">Popular topics</p>
              <ul className="list-disc pl-5 text-sm text-slate-500">
                <li>Changing your step goal</li>
                <li>Logging meals</li>
                <li>Using meal plans</li>
              </ul>
            </div>
          </>
        )}

        {page === 'contact' && (
          <>
            <h1 className="text-xl font-bold text-slate-800">Contact us</h1>
            <div className={card}>
              <p className="text-sm text-slate-600">Email: support@dailyfit.example</p>
              <p className="mt-1 text-sm text-slate-500">We usually reply within 2 business days.</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}