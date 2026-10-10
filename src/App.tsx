import { useEffect, useState } from 'react'
import FitnessApp from './components/FitnessApp'
import FaqPage from './components/FaqPage'
import VaultHome from './components/VaultHome'
import { lockVault } from './crypto/vault'
import { inGrace } from './lib/lockGrace'

type Screen = 'app' | 'real' | 'faq'

export default function App() {
  const [screen, setScreen] = useState<Screen>('app')

  const lock = () => {
    lockVault()
    setScreen('app')
  }

  // Auto-lock whenever the page is hidden (tab switch, app switch),
  // except briefly while the camera or file picker is open.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && !inGrace()) {
        lockVault()
        setScreen('app')
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  if (screen === 'real') return <VaultHome onClose={lock} />
  if (screen === 'faq') return <FaqPage onBack={() => setScreen('app')} />
  return (
    <FitnessApp
      onResult={(mode) => setScreen(mode === 'real' ? 'real' : 'faq')}
    />
  )
}