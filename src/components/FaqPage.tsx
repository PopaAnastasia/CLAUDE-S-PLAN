const FAQ = [
  { q: 'How do I change my step goal?', a: 'Your daily step goal is 10,000 by default. A setting to change it is coming in a future update.' },
  { q: 'How do I log a meal?', a: 'Open Calorie tracker from the menu, enter the food and its calories, and tap Add.' },
  { q: 'Can I use the app without an account?', a: 'Yes. Daily Fit does not require an account, and your logs stay on this device.' },
  { q: 'How do I clear my data?', a: 'Use the Remove button next to each meal, or Reset on the Step counter page.' },
  { q: 'How do I pick a meal plan?', a: 'Open Meal plans from the menu to browse the available plans.' },
]

export default function FaqPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 max-w-md mx-auto p-5">
      <button onClick={onBack} className="mb-4 text-sm text-slate-600">← Back to app</button>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Suggested answers</h1>
      <p className="mb-4 text-sm text-slate-500">These articles may answer your question.</p>
      <div className="space-y-2">
        {FAQ.map((f) => (
          <details key={f.q} className="rounded-xl bg-white p-4">
            <summary className="cursor-pointer font-medium text-slate-800">{f.q}</summary>
            <p className="mt-2 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}