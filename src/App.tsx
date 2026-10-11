import { useEffect, useRef, useState } from 'react'
import FitnessApp from './components/FitnessApp'
import FaqPage from './components/FaqPage'
import VaultHome from './components/VaultHome'
import ReceivePage from './components/ReceivePage'
import WelcomeTour from './components/WelcomeTour'
import { lockVault } from './crypto/vault'
import { inGrace, isHeld } from './lib/lockGrace'

type Screen = 'app' | 'real' | 'faq'
const IDLE_MS = 2 * 60 * 1000
const isReceive = () => window.location.hash.startsWith('#/receive')

export default function App() {
  const [screen, setScreen] = useState<Screen>('app')
  const [receive, setReceive] = useState(isReceive())
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem('daily.tourSeen') !== 'true'
    } catch {
      return true
    }
  })
  const screenRef = useRef(screen)
  screenRef.current = screen

  const lock = () => {
    lockVault()
    setScreen('app')
  }

  useEffect(() => {
    const h = () => setReceive(isReceive())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  // Auto-lock whenever the page is hidden (tab switch, app switch),
  // except briefly while the camera or file picker is open.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && !inGrace() && !isHeld()) lock()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // Auto-lock after 2 minutes without touching the screen.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(function fire() {
        if (screenRef.current !== 'real') return
        if (isHeld() || inGrace()) {
          timer = setTimeout(fire, 15_000)
          return
        }
        lock()
      }, IDLE_MS)
    }
    const evs = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'input'] as const
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true, capture: true }))
    arm()
    return () => {
      clearTimeout(timer)
      evs.forEach((e) => window.removeEventListener(e, arm, { capture: true }))
    }
  }, [])

  if (receive) return <ReceivePage />
  if (screen === 'real') return <VaultHome onClose={lock} />
  if (screen === 'faq') return <FaqPage onBack={() => setScreen('app')} />
  const dismissGuide = () => {
    setShowGuide(false)
    try {
      localStorage.setItem('daily.tourSeen', 'true')
    } catch {
      // The guide can still be dismissed when storage is unavailable.
    }
  }

  return (
    <>
      <FitnessApp onResult={(mode) => setScreen(mode === 'real' ? 'real' : 'faq')} />
      {showGuide && <WelcomeTour onDone={dismissGuide} />}
    </>
  )
}
