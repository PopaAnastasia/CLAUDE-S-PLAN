import { useCallback, useEffect, useRef, useState } from 'react'

// Counts firm jolts. Three spaced hits inside about 1.2 seconds = a shake.
// A jolt is more than ~1.1 g of movement on top of gravity, which a deliberate
// shake easily reaches but walking or putting the phone down does not.
const JOLT = 11 // m/s^2
export function makeShakeDetector(onShake: () => void, now: () => number = Date.now) {
  const hits: number[] = []
  let lastFire = -Infinity
  // `motion` is how hard the phone is moving, with gravity already removed.
  return (motion: number) => {
    if (motion < JOLT) return
    const t = now()
    if (hits.length && t - hits[hits.length - 1] < 100) return
    hits.push(t)
    while (hits.length && t - hits[0] > 1200) hits.shift()
    if (hits.length >= 3 && t - lastFire > 1500) {
      lastFire = t
      hits.length = 0
      onShake()
    }
  }
}

// Reads a motion event. Uses gravity-free acceleration when the phone gives it,
// otherwise total acceleration minus gravity.
export function motionOf(e: DeviceMotionEvent): number | null {
  const a = e.acceleration
  if (a && a.x != null && a.y != null && a.z != null) return Math.hypot(a.x, a.y, a.z)
  const g = e.accelerationIncludingGravity
  if (g && g.x != null && g.y != null && g.z != null) return Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81)
  return null
}

const KEY = 'fit.shake'
type DME = typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> }

const motionApi = () =>
  (typeof window !== 'undefined'
    ? (window as unknown as { DeviceMotionEvent?: DME }).DeviceMotionEvent
    : undefined)

// iPhone only shares motion after the person allows it, and the request has to
// come straight from a tap. Android and most other browsers need no request.
let motionAllowed = !motionApi()?.requestPermission
let pending: Promise<boolean> | null = null
const listeners = new Set<(ok: boolean) => void>()

// Call at the very start of a tap handler (before any await). Safe to call on
// every tap: iPhone only shows its prompt once, then answers silently.
export function requestMotion(): Promise<boolean> {
  const D = motionApi()
  if (!D?.requestPermission) {
    motionAllowed = true
    return Promise.resolve(true)
  }
  if (pending) return pending
  pending = D.requestPermission()
    .then((r) => r === 'granted')
    .catch(() => false)
    .then((ok) => {
      motionAllowed = ok
      pending = null
      try {
        if (ok) localStorage.setItem(MOTION_OK, '1')
        else localStorage.removeItem(MOTION_OK)
      } catch {
        /* ignore */
      }
      listeners.forEach((fn) => fn(ok))
      return ok
    })
  return pending
}

const MOTION_OK = 'fit.motion'

// Called on the first tap of every launch. If the person already allowed
// motion before, iPhone answers silently, so no popup ever appears here. If
// they never allowed it, we don't ask on a random tap: the welcome tour,
// Start walk and private setup ask at moments where it makes sense.
export function renewMotion() {
  try {
    if (localStorage.getItem(MOTION_OK) === '1') void requestMotion()
  } catch {
    /* ignore */
  }
}

// Shake-to-close is ON by default. It is only off if the person turned it off.
export function useShake(onShake: () => void) {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== '0'
    } catch {
      return true
    }
  })
  const [allowed, setAllowed] = useState(motionAllowed)
  const [denied, setDenied] = useState(false)
  const cb = useRef(onShake)
  cb.current = onShake
  const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window

  // Pick up permission granted anywhere else (e.g. the Help search tap), even
  // if the person taps "Allow" after the journal has already opened.
  useEffect(() => {
    const fn = (ok: boolean) => {
      setAllowed(ok)
      if (ok) setDenied(false)
    }
    listeners.add(fn)
    if (motionAllowed) setAllowed(true)
    return () => {
      listeners.delete(fn)
    }
  }, [])

  useEffect(() => {
    if (!on || !supported || !allowed) return
    const detect = makeShakeDetector(() => cb.current())
    const h = (e: DeviceMotionEvent) => {
      const m = motionOf(e)
      if (m !== null) detect(m)
    }
    window.addEventListener('devicemotion', h)
    return () => window.removeEventListener('devicemotion', h)
  }, [on, supported, allowed])

  const enable = useCallback(async () => {
    const ok = await requestMotion()
    setAllowed(ok)
    setDenied(!ok)
    if (!ok) return
    setOn(true)
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }, [])
  const disable = useCallback(() => {
    setOn(false)
    try {
      localStorage.setItem(KEY, '0')
    } catch {
      /* ignore */
    }
  }, [])
  // On iPhone, shake is switched on but still needs one tap to allow motion.
  const needsTap = supported && on && !allowed

  // Ask on the first tap anywhere, so nobody has to find the banner.
  useEffect(() => {
    if (!needsTap || denied) return
    const once = () => void enable()
    window.addEventListener('click', once, { once: true, capture: true })
    return () => window.removeEventListener('click', once, { capture: true })
  }, [needsTap, denied, enable])
  return { supported, on: on && allowed, needsTap, denied, enable, disable }
}
