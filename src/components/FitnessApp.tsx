import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { unlockVault, type VaultMode } from '../crypto/vault'
import { Dashboard, Workouts } from './Dashboard'
import ProfilePage from './ProfilePage'
import { Calories, FontsPage, SettingsPage, Steps } from './Trackers'
import {
  NAV, SIZES, TABS, TITLES, card, field, primary, useStored,
  type Food, type Log, type Page, type Size, type Workout,
} from './data'

export default function FitnessApp({
  onResult,
}: {
  onResult: (mode: VaultMode | null) => void
}) {
  const [page, setPage] = useState<Page>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [steps, setSteps] = useStored<number>('fit.steps', 6420)
  const [goal, setGoal] = useStored<number>('fit.goal', 10000)
  const [foods, setFoods] = useStored<Food[]>('fit.foods', [])
  const [logs, setLogs] = useStored<Log[]>('fit.logs', [])
  const [size, setSize] = useStored<Size>('fit.size', 'normal')
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[size]
  }, [size])

  const totalKcal = foods.reduce((s, f) => s + f.kcal, 0)
  const burned = logs.reduce((s, l) => s + l.kcal, 0)

  const go = (p: Page) => {
    setPage(p)
    setMenuOpen(false)
  }

  const logWorkout = (w: Workout) =>
    setLogs([
      { id: Date.now(), name: w.name, mins: w.mins, kcal: w.kcal, at: new Date().toISOString() },
      ...logs,
    ])

  // Every question is checked against the vault. Real phrase -> private journal.
  // Backup phrase or anything else -> the same FAQ page.
  const ask = async () => {
    if (busy || !question.trim()) return
    setBusy(true)
    let mode: VaultMode | null = null
    try {
      mode = await unlockVault(question)
    } catch {
      mode = null
    }
    setQuestion('')
    setBusy(false)
    onResult(mode)
  }
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-wide">{TITLES[page]}</h1>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
          U
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-y-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2">
          <aside className="flex w-72 flex-col justify-between bg-white shadow-2xl">
            <div>
              <div className="bg-indigo-600 p-6 text-white">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-xl font-bold">
                  U
                </div>
                <h2 className="text-lg font-bold">My Profile</h2>
                <p className="text-xs text-indigo-200">Goal: Stay active</p>
              </div>
              <nav className="space-y-1 p-4">
                {NAV.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Icon size={20} className="text-indigo-500" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex gap-4 border-t border-slate-100 p-4">
              <button className="text-xs text-slate-400" onClick={() => go('help')}>Help</button>
              <button className="text-xs text-slate-400" onClick={() => go('contact')}>Contact us</button>
            </div>
          </aside>
          <button
            className="flex-1 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 space-y-4 p-4">
        {page === 'dashboard' && (
          <Dashboard
            steps={steps}
            goal={goal}
            burned={burned}
            totalKcal={totalKcal}
            logs={logs}
            go={go}
          />
        )}
        {page === 'workouts' && <Workouts onLog={logWorkout} />}
        {page === 'calories' && (
          <Calories foods={foods} setFoods={setFoods} totalKcal={totalKcal} />
        )}
        {page === 'steps' && <Steps steps={steps} setSteps={setSteps} goal={goal} />}
        {page === 'settings' && <SettingsPage goal={goal} setGoal={setGoal} />}
        {page === 'fonts' && <FontsPage size={size} setSize={setSize} />}
        {page === 'profile' && <ProfilePage />}

        {page === 'help' && (
          <>
            <p className="text-sm text-slate-500">
              Find answers about syncing, tracking and settings, or ask us a question.
            </p>
            <div className="space-y-2">
              {[
                ['How do I change my step goal?', 'Open Settings from the menu and choose a daily step goal.'],
                ['How do I log a meal?', 'Open Calorie Tracker, enter the food and its calories, then tap Log meal.'],
                ['Do I need an account?', 'No. Your logs stay on this device.'],
              ].map(([q, a]) => (
                <details key={q} className={card}>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">{q}</summary>
                  <p className="mt-2 text-xs text-slate-500">{a}</p>
                </details>
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-100 p-4">
              <p className="text-sm font-bold text-slate-700">Ask a question</p>
              <p className="text-xs text-slate-500">
                Can&apos;t find your answer? Search our help articles.
              </p>
              <div className="flex gap-2">
                <input
                  className={field}
                  placeholder="Type your question"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void ask()
                  }}
                />
                <button
                  disabled={busy}
                  onClick={() => void ask()}
                  className={`${primary} disabled:opacity-60`}
                >
                  {busy ? '…' : 'Search'}
                </button>
              </div>
            </div>
          </>
        )}

        {page === 'contact' && (
          <div className={card}>
            <p className="text-sm text-slate-600">Email: support@dailyfit.example</p>
            <p className="mt-1 text-xs text-slate-400">
              We usually reply within 2 business days.
            </p>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 flex justify-around border-t border-slate-100 bg-white py-2 text-xs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            className={`flex flex-col items-center gap-0.5 ${page === id ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </footer>
    </div>
  )
}