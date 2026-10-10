import { useState } from 'react'
import { DECOY_PIN, REAL_PIN } from '../lib/pins'
import type { ProfileData } from './Profile'

type View = 'dashboard' | 'log' | 'help' | 'support' | 'vault'
type Meal = { id: number; food: string; time: string; calories: number }
type Props = { onChangeTheme: () => void; onProfile: () => void; profile: ProfileData }

const titles: Record<View, string> = {
  dashboard: 'Meal Dashboard',
  log: 'Log a Meal',
  help: 'Help & Support',
  support: 'Support Center',
  vault: 'Secure Vault',
}

export default function MealTracker({ onChangeTheme, onProfile, profile }: Props) {
  const [view, setView] = useState<View>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [food, setFood] = useState('')
  const [mealTime, setMealTime] = useState('Breakfast')
  const [calories, setCalories] = useState('')
  const [meals, setMeals] = useState<Meal[]>([
    { id: 1, food: 'Oatmeal and berries', time: 'Breakfast', calories: 380 },
    { id: 2, food: 'Grilled chicken salad', time: 'Lunch', calories: 520 },
  ])
  const [key, setKey] = useState('')
  const [keyError, setKeyError] = useState(false)
  const [supportMode, setSupportMode] = useState<'standard' | 'expanded'>('standard')

  const totalCalories = meals.reduce((total, meal) => total + meal.calories, 0)
  const navigate = (nextView: View) => {
    setView(nextView)
    setMenuOpen(false)
  }
  const addMeal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(calories)
    if (!food.trim() || !mealTime || !Number.isFinite(amount) || amount <= 0) return
    setMeals((current) => [{ id: Date.now(), food: food.trim(), time: mealTime, calories: amount }, ...current])
    setFood('')
    setCalories('')
    setView('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-white shadow-xl">
        <header className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <button aria-label="Open menu" className="text-xl" onClick={() => setMenuOpen(true)}>☰</button>
            <h1 className="text-lg font-bold tracking-wide">{titles[view]}</h1>
          </div>
          <button aria-label="Open profile" className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: profile.color }} onClick={onProfile}>
            {(profile.firstName[0] || 'U').toUpperCase()}
          </button>
        </header>

        {menuOpen && (
          <>
            <button aria-label="Close menu" className="fixed inset-0 z-20 bg-black/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 z-30 flex w-72 flex-col bg-white shadow-2xl">
              <div>
                <button className="w-full bg-emerald-600 p-6 text-left text-white" onClick={onProfile}>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: profile.color }}>{(profile.firstName[0] || 'U').toUpperCase()}</div>
                  <h2 className="text-lg font-bold">{profile.firstName || 'My Profile'}</h2>
                  <p className="text-xs text-emerald-100">Goal: Eat Well</p>
                </button>
                <nav className="space-y-1 p-4">
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100" onClick={() => navigate('dashboard')}>⌂ <span>Dashboard</span></button>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100" onClick={() => navigate('log')}>＋ <span>Log Food</span></button>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100" onClick={() => navigate('help')}>? <span>Help &amp; Support</span></button>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100" onClick={() => { setMenuOpen(false); onChangeTheme() }}>🎨 <span>Change Theme</span></button>
                </nav>
              </div>
              <button className="m-4 rounded bg-slate-100 py-2 text-xs font-medium text-slate-500" onClick={() => setMenuOpen(false)}>Close</button>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-4">
          {view === 'dashboard' && (
            <div className="space-y-4">
              <section className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-md">
                <h2 className="text-sm uppercase tracking-wider opacity-80">Today's Nutrition</h2>
                <div className="mt-2 flex items-end justify-between">
                  <div><span className="text-4xl font-extrabold">{totalCalories.toLocaleString()}</span><span className="text-sm opacity-90"> / 2,000 kcal</span></div>
                  <span className="text-2xl">🥗</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${Math.min((totalCalories / 2000) * 100, 100)}%` }} /></div>
              </section>
              <button className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700" onClick={() => navigate('log')}>＋ Log Food</button>
              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="mb-2 font-bold text-slate-700">Today's Meals</h3>
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                      <div><p className="font-semibold text-slate-700">{meal.food}</p><p className="text-xs text-slate-400">{meal.time}</p></div>
                      <span className="text-sm font-semibold text-emerald-600">{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === 'log' && (
            <form className="space-y-4" onSubmit={addMeal}>
              <h2 className="text-xl font-bold">Log Food</h2>
              <label className="block text-sm font-medium text-slate-600">Food or meal<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={food} onChange={(event) => setFood(event.target.value)} placeholder="e.g. Greek yogurt" /></label>
              <label className="block text-sm font-medium text-slate-600">Meal time<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={mealTime} onChange={(event) => setMealTime(event.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
              <label className="block text-sm font-medium text-slate-600">Calories<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" inputMode="numeric" type="number" min="1" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="e.g. 450" /></label>
              <button className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700" type="submit">Save Meal</button>
            </form>
          )}

          {view === 'help' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">App Help &amp; FAQ</h2>
              <p className="text-sm text-slate-500">Find answers about meal logging, nutrition goals, and local activity data.</p>
              <section className="rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm"><p className="font-semibold">How are meals stored?</p><p className="mt-1 text-xs text-slate-400">Your meal entries are kept locally on this device.</p></section>
              <section className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                <h3 className="mb-1 text-sm font-bold">Ask for Help</h3><p className="mb-3 text-xs text-slate-500">Enter your support key to open additional support options.</p>
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const submittedKey = key.trim(); setKey(''); if (submittedKey === REAL_PIN) { setSupportMode('expanded'); setKeyError(false); setView('support') } else if (submittedKey === DECOY_PIN) { setSupportMode('standard'); setKeyError(false); setView('support') } else setKeyError(true) }}>
                  <input aria-label="Support key" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" inputMode="numeric" maxLength={6} placeholder="Enter key..." type="password" value={key} onChange={(event) => { setKey(event.target.value.replace(/\D/g, '')); setKeyError(false) }} />
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white" type="submit">Submit</button>
                </form>
                {keyError && <p className="mt-2 text-xs text-red-500">Invalid key. Please try again.</p>}
              </section>
            </div>
          )}

          {view === 'support' && (
            <div className="space-y-4">
              <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800"><p className="text-xs font-semibold uppercase tracking-wide">Support session active</p><h2 className="mt-1 text-xl font-bold">{supportMode === 'expanded' ? 'Expanded Support' : 'Support Center'}</h2></section>
              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><h3 className="font-bold">Meal Data &amp; Storage</h3><p className="mt-1 text-sm text-slate-500">Your nutrition entries are stored locally on this device.</p></section>
              {supportMode === 'expanded' && <><section className="rounded-xl border border-red-100 bg-red-50 p-4"><h3 className="font-bold text-red-800">Get Help Now</h3><p className="mt-1 text-sm text-red-700">Choose a call option. Your phone will ask you to confirm before dialing.</p><div className="mt-3 grid gap-2"><a className="rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white" href="tel:911">Call 911</a><a className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-red-700" href="tel:18007997233">Call National Domestic Violence Hotline</a></div></section><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="font-bold">Secure Vault</h3><p className="mt-1 text-sm text-slate-500">Open your protected evidence workspace.</p><button className="mt-3 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white" onClick={() => setView('vault')}>Open Secure Vault</button></section></>}
              <button className="w-full rounded-xl bg-slate-200 py-2.5 text-sm font-medium" onClick={() => setView('dashboard')}>Return to Dashboard</button>
            </div>
          )}

          {view === 'vault' && <div className="space-y-4"><div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"><span className="text-xs font-semibold">🔒 Secure Vault Active</span><button className="rounded bg-red-600 px-2.5 py-1 text-xs text-white" onClick={() => setView('dashboard')}>Quick Exit</button></div><h2 className="text-lg font-bold">Protected Evidence Workspace</h2><section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><h3 className="font-bold">Evidence Archive</h3><p className="mt-1 text-sm text-slate-500">Your protected archive is ready. Evidence tools will be added in a later feature.</p></section></div>}
        </main>
        <footer className="flex items-center justify-around border-t border-slate-100 bg-white px-4 py-2 text-xs text-slate-400"><button className="flex flex-col items-center" onClick={() => navigate('dashboard')}>⌂<span>Home</span></button><button className="flex flex-col items-center" onClick={() => navigate('log')}>＋<span>Log Food</span></button><button className="flex flex-col items-center" onClick={() => navigate('help')}>?<span>Help</span></button></footer>
      </div>
    </div>
  )
}
