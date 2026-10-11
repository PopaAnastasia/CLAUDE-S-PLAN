import { useCallback, useEffect, useRef, useState } from 'react'
import { requestMotion } from './useShake'

// Counts steps from the phone's motion sensor. Each step shows up as a bump
// in total acceleration; we smooth the signal, track a slow baseline (gravity
// plus however the phone is held) and count one step per bump that rises
// clearly above it, at a human walking or running pace.
export function makeStepDetector(onStep: () => void, now: () => number = Date.now) {
  let smooth = 9.81
  let base = 9.81
  let high = false
  let last = -Infinity
  return (ax: number, ay: number, az: number) => {
    const mag = Math.sqrt(ax * ax + ay * ay + az * az)
    smooth = smooth * 0.75 + mag * 0.25
    base = base * 0.98 + mag * 0.02
    const t = now()
    if (!high && smooth > base + 1.2) {
      high = true
      // 250 ms = fast running cadence; anything quicker is a jolt, not a step.
      if (t - last > 250) {
        last = t
        onStep()
      }
    } else if (high && smooth < base + 0.3) {
      high = false
    }
  }
}

type WakeLock = { release: () => Promise<void> }
type WakeNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLock> } }

// Walk mode: counts live while the app is open on screen. A web app can't
// count in the background, so the screen is kept on while a walk runs.
export function useWalk() {
  const [active, setActive] = useState(false)
  const [count, setCount] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [error, setError] = useState('')
  const wake = useRef<WakeLock | null>(null)
  const counted = useRef(0)
  const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window

  useEffect(() => {
    if (!active) return
    const detect = makeStepDetector(() => {
      counted.current += 1
      setCount(counted.current)
    })
    const h = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a && a.x != null && a.y != null && a.z != null) detect(a.x, a.y, a.z)
    }
    window.addEventListener('devicemotion', h)
    return () => window.removeEventListener('devicemotion', h)
  }, [active])

  const releaseWake = () => {
    void wake.current?.release().catch(() => {})
    wake.current = null
  }

  // Call straight from a tap so iPhone can show its motion prompt.
  const start = useCallback(async () => {
    setError('')
    if (!supported) {
      setError('Walk tracking needs a phone with a motion sensor.')
      return
    }
    if (!(await requestMotion())) {
      setError('Motion access was not allowed, so steps can’t be counted. You can allow it in your browser settings.')
      return
    }
    counted.current = 0
    setCount(0)
    setStartedAt(Date.now())
    setActive(true)
    try {
      wake.current = (await (navigator as WakeNav).wakeLock?.request('screen')) ?? null
    } catch {
      wake.current = null
    }
  }, [supported])

  // Returns the steps counted and resets.
  const stop = useCallback(() => {
    setActive(false)
    setStartedAt(null)
    releaseWake()
    const n = counted.current
    counted.current = 0
    setCount(0)
    return n
  }, [])

  useEffect(() => () => releaseWake(), [])

  return { supported, active, count, startedAt, error, start, stop }
}
