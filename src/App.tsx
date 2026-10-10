import { useEffect, useState } from 'react'
import Calculator from './components/Calculator'
type Screen = 'calc' | 'real' | 'decoy'

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
  const [screen, setScreen] = useState<Screen>('calc')

  // Auto-lock whenever the page is hidden (tab switch, app switch)
  useEffect(() => {
    const onHide = () => { if (document.hidden) setScreen('calc') }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  if (screen === 'real') return <Placeholder title="Real vault" onLock={() => setScreen('calc')} />
  if (screen === 'decoy') return <Placeholder title="Decoy vault" onLock={() => setScreen('calc')} />
  return <Calculator onUnlock={setScreen} />
}