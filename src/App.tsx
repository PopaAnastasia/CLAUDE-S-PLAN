import { useEffect, useState } from 'react'
import FitnessApp from './components/FitnessApp'
import FaqPage from './components/FaqPage'
import Setup from './components/Setup'
import { isVaultConfigured, lockVault } from './crypto/vault'

type Screen = 'setup' | 'app' | 'real' | 'faq'

function Placeholder({ title, onLock }: { title: string; onLock: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
      <button className="px-6 py-3 rounded-xl bg-slate-800 text-white" onClick={onLock}>
        Lock
      </button>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    isVaultConfigured() ? 'app' : 'setup',
  )

  const lock = () => {
    lockVault()
    setScreen('app')
  }

  // Auto-lock whenever the page is hidden (tab switch, app switch)
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        lockVault()
        setScreen((s) => (s === 'setup' ? s : 'app'))
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  if (screen === 'setup') return <Setup onDone={() => setScreen('app')} />
  if (screen === 'real') return <Placeholder title="Real vault" onLock={lock} />
  if (screen === 'faq') return <FaqPage onBack={() => setScreen('app')} />
  return (
    <FitnessApp
      onResult={(mode) => setScreen(mode === 'real' ? 'real' : 'faq')}
    />
  )
}