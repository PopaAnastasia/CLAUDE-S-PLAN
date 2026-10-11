import { useEffect, useRef, useState } from 'react'
import FitnessApp from './components/FitnessApp'
import VaultHome from './components/VaultHome'
import { SetupPage } from './components/Phrases'
import ReceivePage from './components/ReceivePage'
import WelcomeTour from './components/WelcomeTour'
import Splash, { shouldShowSplash } from './components/Splash'
import { lockVault } from './crypto/vault'
import { inGrace, isHeld } from './lib/lockGrace'
import { renewMotion } from './lib/useShake'

type Screen = 'app' | 'real' | 'setup'
const IDLE_MS = 2 * 60 * 1000
const isReceive = () => window.location.hash.startsWith('#/receive')

export default function App() {
  const [screen, setScreen] = useState<Screen>('app')
  const [receive, setReceive] = useState(isReceive())
  const [splash, setSplash] = useState(() => !isReceive() && shouldShowSplash())
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

  // Motion (for walks and shake-to-exit) is renewed on the first tap of each
  // launch. iPhone requires a tap for this, but stays silent once allowed.
  useEffect(() => {
    const once = () => {
      renewMotion()
      window.removeEventListener('click', once, true)
      window.removeEventListener('touchend', once, true)
    }
    window.addEventListener('click', once, true)
    window.addEventListener('touchend', once, true)
    return () => {
      window.removeEventListener('click', once, true)
      window.removeEventListener('touchend', once, true)
    }
  }, [])

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
  if (screen === 'setup') return <SetupPage onDone={() => setScreen('real')} onCancel={() => setScreen('app')} />
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
      <FitnessApp
        onResult={(mode) => mode === 'real' && setScreen('real')}
        onSetup={() => setScreen('setup')}
      />
      {showGuide && !splash && <WelcomeTour onDone={dismissGuide} />}
      {splash && <Splash onDone={() => setSplash(false)} />}
    </>
  )
}
