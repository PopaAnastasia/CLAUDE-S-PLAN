import { useCallback, useEffect, useRef, useState } from 'react'

// Counts hard jolts. Four spaced hits inside about one second = a shake.
export function makeShakeDetector(onShake: () => void, now: () => number = Date.now) {
  const hits: number[] = []
  let lastFire = -Infinity
  return (ax: number, ay: number, az: number) => {
    const mag = Math.sqrt(ax * ax + ay * ay + az * az)
    if (Math.abs(mag - 9.81) < 15) return
    const t = now()
    if (hits.length && t - hits[hits.length - 1] < 120) return
    hits.push(t)
    while (hits.length && t - hits[0] > 1000) hits.shift()
    if (hits.length >= 4 && t - lastFire > 2000) {
      lastFire = t
      hits.length = 0
      onShake()
    }
  }
}

const KEY = 'fit.shake'
type DME = typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> }

export function useShake(onShake: () => void) {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const [granted, setGranted] = useState(true)
  const cb = useRef(onShake)
  cb.current = onShake
  const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window

  useEffect(() => {
    if (!on || !supported) return
    const detect = makeShakeDetector(() => cb.current())
    const h = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a && a.x != null && a.y != null && a.z != null) detect(a.x, a.y, a.z)
    }
    window.addEventListener('devicemotion', h)
    return () => window.removeEventListener('devicemotion', h)
  }, [on, supported])

  const enable = useCallback(async () => {
    const D = (window as unknown as { DeviceMotionEvent?: DME }).DeviceMotionEvent
    if (D?.requestPermission) {
      try {
        if ((await D.requestPermission()) !== 'granted') {
          setGranted(false)
          return
        }
      } catch {
        setGranted(false)
        return
      }
    }
    setGranted(true)
    setOn(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])
  const disable = useCallback(() => {
    setOn(false)
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }, [])
  return { supported, on, granted, enable, disable }
}
