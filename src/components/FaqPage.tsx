const FAQ = [
  { q: 'How do I change my step goal?', a: 'Open Settings from the menu and choose a daily step goal.' },
  { q: 'How do I log a meal?', a: 'Open Calorie Tracker from the menu, enter the food and its calories, and tap Log meal.' },
  { q: 'How do I log a workout?', a: 'Open Workouts and tap Log workout on any session.' },
  { q: 'Can I use the app without an account?', a: 'Yes. Daily Fit does not require an account, and your logs stay on this device.' },
  { q: 'How do I clear my data?', a: 'Use Remove next to each meal, or Reset on the Step Counter page.' },
]

export default function FaqPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 p-5">
      <button onClick={onBack} className="mb-4 text-sm text-indigo-600">← Back to app</button>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Suggested answers</h1>
      <p className="mb-4 text-sm text-slate-500">These articles may answer your question.</p>
      <div className="space-y-2">
        {FAQ.map((f) => (
          <details key={f.q} className="rounded-xl border border-slate-100 bg-white p-4">
            <summary className="cursor-pointer font-medium text-slate-800">{f.q}</summary>
            <p className="mt-2 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}