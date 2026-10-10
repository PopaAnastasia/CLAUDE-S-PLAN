import { useState } from 'react'

export type ProfileData = {
  firstName: string
  color: string
}

type Props = {
  profile: ProfileData
  onSave: (profile: ProfileData) => void
  onBack: () => void
}

const colors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
]

export default function Profile({ profile, onSave, onBack }: Props) {
  const [firstName, setFirstName] = useState(profile.firstName)
  const [color, setColor] = useState(profile.color)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center gap-3 px-4 py-3 text-white shadow-md" style={{ backgroundColor: color }}>
          <button aria-label="Back" className="text-2xl" onClick={onBack}>‹</button>
          <h1 className="text-lg font-bold">My Profile</h1>
        </header>
        <main className="flex-1 space-y-6 p-5">
          <div className="flex flex-col items-center rounded-2xl bg-slate-50 p-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white" style={{ backgroundColor: color }}>
              {(firstName.trim()[0] || 'U').toUpperCase()}
            </div>
            <p className="mt-3 text-lg font-bold">{firstName.trim() || 'Your name'}</p>
            <p className="text-sm text-slate-500">This profile is shared across all themes.</p>
          </div>

          <label className="block text-sm font-medium text-slate-600">
            First name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={40}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Enter your first name"
              value={firstName}
            />
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-slate-600">Profile color</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {colors.map((option) => (
                <button
                  key={option.value}
                  aria-label={option.name}
                  aria-pressed={color === option.value}
                  className={`h-11 w-11 rounded-full border-4 ${color === option.value ? 'border-slate-800' : 'border-white shadow'}`}
                  style={{ backgroundColor: option.value }}
                  onClick={() => setColor(option.value)}
                  type="button"
                />
              ))}
            </div>
          </fieldset>

          <button
            className="w-full rounded-xl py-3 font-semibold text-white shadow-sm"
            style={{ backgroundColor: color }}
            onClick={() => onSave({ firstName: firstName.trim(), color })}
          >
            Save Profile
          </button>
        </main>
      </div>
    </div>
  )
}
