type Theme = 'fitness' | 'calculator' | 'meal'
type Props = {
  currentTheme: Theme
  onSelect: (theme: Theme) => void
  onBack: () => void
}

const themes: { id: Theme; icon: string; name: string; description: string }[] = [
  { id: 'fitness', icon: '🏃', name: 'Fitness Tracker', description: 'Track workouts, steps, and activity.' },
  { id: 'meal', icon: '🍽', name: 'Meal Tracker', description: 'Log food, meal times, and calories.' },
  { id: 'calculator', icon: '🧮', name: 'Calculator', description: 'Use the everyday calculator.' },
]

export default function ThemePicker({ currentTheme, onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center gap-3 bg-slate-800 px-4 py-3 text-white shadow-md">
          <button aria-label="Back" className="text-2xl" onClick={onBack}>‹</button>
          <h1 className="text-lg font-bold">Change Theme</h1>
        </header>
        <main className="flex-1 space-y-4 p-5">
          <div>
            <h2 className="text-2xl font-bold">Choose an app</h2>
            <p className="mt-1 text-sm text-slate-500">Select the dashboard you want to use.</p>
          </div>
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:border-slate-400 hover:shadow-sm ${
                  currentTheme === theme.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
                onClick={() => onSelect(theme.id)}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{theme.icon}</span>
                <span className="flex-1">
                  <span className="block font-bold text-slate-800">{theme.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{theme.description}</span>
                </span>
                {currentTheme === theme.id && <span className="text-xs font-semibold text-indigo-600">Current</span>}
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
