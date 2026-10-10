import { useEffect, useState } from 'react'
import Calculator from './components/Calculator'
import FitnessTracker from './components/FitnessTracker'
import MealTracker from './components/MealTracker'
import Profile, { type ProfileData } from './components/Profile'
import ThemePicker from './components/ThemePicker'

export default function App() {
  const [theme, setTheme] = useState<'fitness' | 'calculator' | 'meal'>('fitness')
  const [screen, setScreen] = useState<'app' | 'real' | 'decoy'>('app')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({ firstName: '', color: '#6366f1' })

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        setTheme('fitness')
        setScreen('app')
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  if (screen === 'real') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100">
        <h1 className="text-3xl font-bold text-slate-800">Real vault</h1>
        <button className="rounded-xl bg-slate-800 px-6 py-3 text-white" onClick={() => setScreen('app')}>
          Lock
        </button>
      </div>
    )
  }

  if (screen === 'decoy') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100">
        <h1 className="text-3xl font-bold text-slate-800">Decoy vault</h1>
        <button className="rounded-xl bg-slate-800 px-6 py-3 text-white" onClick={() => setScreen('app')}>
          Lock
        </button>
      </div>
    )
  }

  if (showThemePicker) {
    return (
      <ThemePicker
        currentTheme={theme}
        onBack={() => setShowThemePicker(false)}
        onSelect={(nextTheme) => {
          setTheme(nextTheme)
          setShowThemePicker(false)
        }}
      />
    )
  }

  if (showProfile) {
    return (
      <Profile
        profile={profile}
        onBack={() => setShowProfile(false)}
        onSave={(nextProfile) => {
          setProfile(nextProfile)
          setShowProfile(false)
        }}
      />
    )
  }

  if (theme === 'calculator') {
    return <Calculator onUnlock={setScreen} onChangeTheme={() => setShowThemePicker(true)} onProfile={() => setShowProfile(true)} profile={profile} />
  }

  if (theme === 'meal') {
    return <MealTracker onChangeTheme={() => setShowThemePicker(true)} onProfile={() => setShowProfile(true)} profile={profile} />
  }

  return <FitnessTracker onChangeTheme={() => setShowThemePicker(true)} onProfile={() => setShowProfile(true)} profile={profile} />
}