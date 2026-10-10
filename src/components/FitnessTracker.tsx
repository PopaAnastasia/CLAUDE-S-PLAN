import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DECOY_PIN, REAL_PIN } from '../lib/pins'
import type { ProfileData } from './Profile'

type View = 'dashboard' | 'workouts' | 'calories' | 'steps' | 'help' | 'support' | 'vault'
type Props = { onChangeTheme: () => void; onProfile: () => void; profile: ProfileData }

const viewTitles: Record<View, string> = {
  dashboard: 'Daily Dashboard',
  workouts: 'Workouts',
  calories: 'Calorie Tracker',
  steps: 'Step Counter',
  help: 'Help & Support',
  support: 'Support Center',
  vault: 'Secure Vault',
}

type Workout = {
  id: number
  name: string
  duration: number
  calories: number
  completedAt: string
}

const initialWorkouts: Workout[] = [
  { id: 1, name: 'Morning Run', duration: 30, calories: 320, completedAt: '8:30 AM' },
  { id: 2, name: 'Walk', duration: 18, calories: 95, completedAt: '12:15 PM' },
]

const workoutOptions = [
  { name: 'Full Body HIIT', description: 'High-intensity interval training.', caloriesPerMinute: 10 },
  { name: 'Morning Run', description: 'A steady outdoor or treadmill run.', caloriesPerMinute: 11 },
  { name: 'Brisk Walk', description: 'A low-impact walk to build daily movement.', caloriesPerMinute: 5 },
]

const todayKey = new Date().toISOString().slice(0, 10)

export default function FitnessTracker({ onChangeTheme, onProfile, profile }: Props) {
  const [view, setView] = useState<View>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [steps, setSteps] = useState(6420)
  const [stepGoal, setStepGoal] = useState(10000)
  const [stepInput, setStepInput] = useState('')
  const [calories, setCalories] = useState(1450)
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts)
  const [activeWorkout, setActiveWorkout] = useState<{ name: string; startedAt: number; caloriesPerMinute: number } | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState(workoutOptions[0].name)
  const [durationInput, setDurationInput] = useState('30')
  const [key, setKey] = useState('')
  const [keyError, setKeyError] = useState(false)
  const [supportMode, setSupportMode] = useState<'standard' | 'expanded'>('standard')

  useEffect(() => {
    const saved = localStorage.getItem(`daily-fitness-${todayKey}`)
    if (!saved) return
    try {
      const data = JSON.parse(saved) as { steps?: number; stepGoal?: number; calories?: number; workouts?: Workout[] }
      if (typeof data.steps === 'number') setSteps(data.steps)
      if (typeof data.stepGoal === 'number') setStepGoal(data.stepGoal)
      if (typeof data.calories === 'number') setCalories(data.calories)
      if (Array.isArray(data.workouts)) setWorkouts(data.workouts)
    } catch {
      // Ignore malformed local data and use the defaults.
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(`daily-fitness-${todayKey}`, JSON.stringify({ steps, stepGoal, calories, workouts }))
  }, [steps, stepGoal, calories, workouts])

  const burnedCalories = useMemo(() => workouts.reduce((total, workout) => total + workout.calories, 0), [workouts])
  const progress = Math.min((steps / stepGoal) * 100, 100)

  const navigate = (nextView: View) => {
    setView(nextView)
    setMenuOpen(false)
  }

  const addSteps = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(stepInput)
    if (!Number.isFinite(amount) || amount <= 0) return
    setSteps((current) => current + Math.round(amount))
    setStepInput('')
  }

  const saveWorkout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const duration = Number(durationInput)
    const option = workoutOptions.find((workout) => workout.name === selectedWorkout)
    if (!option || !Number.isFinite(duration) || duration <= 0) return
    setWorkouts((current) => [{
      id: Date.now(),
      name: option.name,
      duration: Math.round(duration),
      calories: Math.round(duration * option.caloriesPerMinute),
      completedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }, ...current])
    setDurationInput('30')
  }

  const finishActiveWorkout = () => {
    if (!activeWorkout) return
    const duration = Math.max(1, Math.round((Date.now() - activeWorkout.startedAt) / 60000))
    setWorkouts((current) => [{
      id: Date.now(),
      name: activeWorkout.name,
      duration,
      calories: Math.round(duration * activeWorkout.caloriesPerMinute),
      completedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }, ...current])
    setActiveWorkout(null)
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#fbfaff] shadow-xl">
        <header className="z-10 flex items-center justify-between bg-[#6d28d9] px-5 py-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="text-xl transition hover:text-violet-200"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200">Daily</p>
              <h1 className="text-lg font-bold tracking-wide">{viewTitles[view]}</h1>
            </div>
          </div>
          <button aria-label="Open profile" className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: profile.color }} onClick={onProfile}>
            {(profile.firstName[0] || 'U').toUpperCase()}
          </button>
        </header>

        {menuOpen && (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-20 cursor-default bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-30 flex w-72 flex-col justify-between bg-white shadow-2xl">
              <div>
                <button className="w-full bg-indigo-600 p-6 text-left text-white" onClick={onProfile}>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: profile.color }}>
                    {(profile.firstName[0] || 'U').toUpperCase()}
                  </div>
                  <h2 className="text-lg font-bold">{profile.firstName || 'My Profile'}</h2>
                  <p className="text-xs text-indigo-200">Goal: Stay Active</p>
                </button>
                <nav className="space-y-1 p-4">
                  {([
                    ['dashboard', '⌂', 'Dashboard'],
                    ['workouts', '🏋', 'Workouts'],
                    ['calories', '🔥', 'Calorie Tracker'],
                    ['steps', '👟', 'Step Counter'],
                    ['help', '?', 'Help'],
                  ] as [View, string, string][]).map(([key, icon, label]) => (
                    <button
                      key={key}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => navigate(key)}
                    >
                      <span className="w-5 text-center text-indigo-500">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setMenuOpen(false)
                      onChangeTheme()
                    }}
                  >
                    <span className="w-5 text-center text-indigo-500">🎨</span>
                    <span>Change Theme</span>
                  </button>
                </nav>
              </div>
              <div className="border-t border-slate-100 p-4">
                <button
                  className="w-full rounded bg-slate-100 py-2 text-xs font-medium text-slate-500 hover:bg-slate-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Close
                </button>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-4">
          {view === 'dashboard' && (
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600">Good morning{profile.firstName ? `, ${profile.firstName}` : ''}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Keep moving today</h2>
                </div>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Today</span>
              </div>
              <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] p-5 text-white shadow-lg shadow-violet-200">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-14 right-12 h-32 w-32 rounded-full bg-fuchsia-300/10" />
                <div className="relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium uppercase tracking-wider text-violet-100">Today's progress</h2>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">🏆 {Math.round(progress)}%</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <span className="text-5xl font-extrabold tracking-tight">{steps.toLocaleString()}</span>
                    <span className="text-sm text-violet-100"> / {stepGoal.toLocaleString()} steps</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">{burnedCalories.toLocaleString()}</span>
                    <span className="block text-xs text-violet-100">Kcal burned</span>
                  </div>
                </div>
                <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs text-violet-100">{Math.max(stepGoal - steps, 0).toLocaleString()} steps left to reach your goal</p>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="rounded-2xl border border-violet-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => navigate('workouts')}
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-700">🏋</span>
                  <h3 className="font-bold text-slate-700">Workouts</h3>
                  <p className="mt-1 text-xs text-slate-400">{workouts.length} sessions logged</p>
                </button>
                <button
                  className="rounded-2xl border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => navigate('calories')}
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-xl text-orange-600">🔥</span>
                  <h3 className="font-bold text-slate-700">Calories</h3>
                  <p className="mt-1 text-xs text-slate-400">Breakfast &amp; lunch</p>
                </button>
              </div>

              <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700">Recent activity</h3>
                  <button className="text-xs font-semibold text-violet-600" onClick={() => navigate('workouts')}>See all</button>
                </div>
                <div className="space-y-1">
                  {workouts.slice(0, 4).map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-indigo-50 p-2">🏃</span>
                        <div>
                          <p className="font-semibold text-slate-700">{workout.name}</p>
                          <p className="text-xs text-slate-400">{workout.duration} mins • {workout.calories} kcal</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{workout.completedAt}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === 'workouts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Workout Library</h2>
              {activeWorkout && (
                <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Workout in progress</p>
                  <h3 className="mt-1 font-bold text-indigo-900">{activeWorkout.name}</h3>
                  <button className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700" onClick={finishActiveWorkout}>
                    Finish Workout
                  </button>
                </section>
              )}
              <form className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm" onSubmit={saveWorkout}>
                <label className="block text-sm font-medium text-slate-600">
                  Workout
                  <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedWorkout} onChange={(event) => setSelectedWorkout(event.target.value)}>
                    {workoutOptions.map((workout) => <option key={workout.name}>{workout.name}</option>)}
                  </select>
                </label>
                <p className="mt-2 text-xs text-slate-400">{workoutOptions.find((workout) => workout.name === selectedWorkout)?.description}</p>
                <label className="mt-3 block text-sm font-medium text-slate-600">
                  Duration (minutes)
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" inputMode="numeric" min="1" type="number" value={durationInput} onChange={(event) => setDurationInput(event.target.value)} />
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700" type="submit">Log Workout</button>
                  <button
                    className="rounded-lg border border-indigo-200 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                    type="button"
                    onClick={() => {
                      const option = workoutOptions.find((workout) => workout.name === selectedWorkout)
                      if (option) setActiveWorkout({ name: option.name, startedAt: Date.now(), caloriesPerMinute: option.caloriesPerMinute })
                    }}
                  >
                    Start Timer
                  </button>
                </div>
              </form>
              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="mb-2 font-bold text-slate-700">Logged Workouts</h3>
                <div className="space-y-2">
                  {workouts.map((workout) => <div key={workout.id} className="flex justify-between border-b border-slate-50 py-2 text-sm last:border-0"><span><b>{workout.name}</b><span className="block text-xs text-slate-400">{workout.duration} minutes • {workout.completedAt}</span></span><span className="font-medium text-indigo-600">{workout.calories} kcal</span></div>)}
                </div>
              </section>
            </div>
          )}

          {view === 'calories' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Calorie Tracker</h2>
              <section className="rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                <span className="text-3xl font-extrabold text-orange-600">{calories.toLocaleString()}</span>
                <p className="text-xs text-slate-400">Calories consumed today (Goal: 2,000)</p>
              </section>
              <button
                className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-sm hover:bg-orange-600"
                onClick={() => setCalories((current) => current + 250)}
              >
                + Log Meal / Food
              </button>
              <p className="text-center text-xs text-slate-400">Use the Meal Tracker theme for detailed food and meal-time logging.</p>
            </div>
          )}

          {view === 'steps' && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-indigo-100 bg-indigo-50">
                <span className="mb-1 text-2xl">👟</span>
                <span className="text-2xl font-black text-indigo-700">{steps.toLocaleString()}</span>
                <span className="text-xs text-slate-400">Steps</span>
              </div>
              <form className="mx-auto max-w-xs space-y-2 text-left" onSubmit={addSteps}>
                <label className="block text-sm font-medium text-slate-600">Add steps walked<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" inputMode="numeric" min="1" type="number" value={stepInput} onChange={(event) => setStepInput(event.target.value)} placeholder="e.g. 1200" /></label>
                <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700" type="submit">Add Steps</button>
              </form>
              <label className="mx-auto block max-w-xs text-left text-sm font-medium text-slate-600">Daily goal<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" inputMode="numeric" min="1" type="number" value={stepGoal} onChange={(event) => setStepGoal(Math.max(1, Number(event.target.value) || 1))} /></label>
              <p className="text-sm text-slate-500">{Math.max(stepGoal - steps, 0).toLocaleString()} steps remaining today.</p>
            </div>
          )}

          {view === 'help' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">App Help &amp; FAQ</h2>
              <p className="text-sm text-slate-500">Find answers to common questions about tracking your daily activity.</p>
              <section className="rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm">
                <p className="font-semibold text-slate-700">How do I sync my step counter?</p>
                <p className="mt-1 text-xs text-slate-400">Allow health permissions in your device settings, then reopen the app.</p>
              </section>
              <section className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                <h3 className="mb-1 text-sm font-bold text-slate-700">Ask for Help</h3>
                <p className="mb-3 text-xs text-slate-500">Enter your support key to open additional support options.</p>
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const submittedKey = key.trim()
                    setKey('')
                    if (submittedKey === REAL_PIN) {
                      setSupportMode('expanded')
                      setKeyError(false)
                      setView('support')
                    } else if (submittedKey === DECOY_PIN) {
                      setSupportMode('standard')
                      setKeyError(false)
                      setView('support')
                    } else {
                      setKeyError(true)
                    }
                  }}
                >
                  <input
                    aria-label="Support key"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter key..."
                    type="password"
                    value={key}
                    onChange={(event) => {
                      setKey(event.target.value.replace(/\D/g, ''))
                      setKeyError(false)
                    }}
                  />
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" type="submit">
                    Submit
                  </button>
                </form>
                {keyError && <p className="mt-2 text-xs text-red-500">Invalid key. Please try again.</p>}
              </section>
            </div>
          )}

          {view === 'support' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-800">
                <p className="text-xs font-semibold uppercase tracking-wide">Support session active</p>
                <h2 className="mt-1 text-xl font-bold">
                  {supportMode === 'expanded' ? 'Expanded Support' : 'Support Center'}
                </h2>
              </div>
              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-slate-700">Activity Data &amp; Storage</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {supportMode === 'expanded'
                    ? 'Review local activity storage and troubleshooting details for this device.'
                    : 'Your daily activity metrics are stored locally on this device.'}
                </p>
              </section>
              {supportMode === 'expanded' && (
                <>
                  <section className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <h3 className="font-bold text-red-800">Get Help Now</h3>
                    <p className="mt-1 text-sm text-red-700">Choose a call option. Your phone will ask you to confirm before dialing.</p>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <a
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
                        href="tel:911"
                      >
                        Call 911
                      </a>
                      <a
                        className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-red-700 hover:bg-red-100"
                        href="tel:18007997233"
                      >
                        Call National Domestic Violence Hotline
                      </a>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700">Secure Vault</h3>
                    <p className="mt-1 text-sm text-slate-500">Open your protected evidence workspace.</p>
                    <button
                      className="mt-3 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
                      onClick={() => setView('vault')}
                    >
                      Open Secure Vault
                    </button>
                  </section>
                </>
              )}
              <button
                className="w-full rounded-xl bg-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
                onClick={() => setView('dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {view === 'vault' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                <span className="text-xs font-semibold">🔒 Secure Vault Active</span>
                <button
                  className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  onClick={() => setView('dashboard')}
                >
                  Quick Exit
                </button>
              </div>
              <h2 className="text-lg font-bold">Protected Evidence Workspace</h2>
              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-slate-700">Evidence Archive</h3>
                <p className="mt-1 text-sm text-slate-500">Your protected archive is ready. Evidence tools will be added in a later feature.</p>
              </section>
            </div>
          )}
        </main>

        <footer className="flex items-center justify-around border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-400">
          {([
            ['dashboard', '⌂', 'Home'],
            ['workouts', '🏋', 'Workouts'],
            ['calories', '🔥', 'Calories'],
            ['steps', '👟', 'Steps'],
          ] as [View, string, string][]).map(([key, icon, label]) => (
            <button key={key} className={`flex flex-col items-center gap-0.5 transition hover:text-violet-600 ${view === key ? 'font-semibold text-violet-600' : ''}`} onClick={() => navigate(key)}>
              <span className="mb-0.5 text-base">{icon}</span>
              {label}
            </button>
          ))}
        </footer>
      </div>
    </div>
  )
}
