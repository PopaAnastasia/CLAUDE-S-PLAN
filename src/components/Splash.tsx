import { useEffect, useRef, useState } from 'react'

const SEEN = 'shake.introSeen'
const BRAND = '#523acb'

// Plays the Shake logo intro once when the app is opened. Tap to skip.
// It never plays after a quick exit, only on a fresh launch, so leaving the
// journal always lands straight on the Dashboard.
export function shouldShowSplash() {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    return sessionStorage.getItem(SEEN) !== '1'
  } catch {
    return false
  }
}

export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)
  const video = useRef<HTMLVideoElement>(null)

  const finish = () => {
    if (done.current) return
    done.current = true
    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* ignore */
    }
    setLeaving(true)
    setTimeout(onDone, 350)
  }

  useEffect(() => {
    const v = video.current
    if (v) {
      v.playbackRate = 1.4
      void v.play().catch(() => finish())
    }
    // Safety net: never hold the app for more than a few seconds.
    const t = setTimeout(finish, 4500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      type="button"
      aria-label="Skip intro"
      onClick={finish}
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: BRAND }}
    >
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={finish}
        className="w-full max-w-md"
        // Fade the top and bottom edges so the video blends into the background.
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        }}
      >
        <source src="/intro.webm" type="video/webm" />
        {/* The last source failing means nothing could play: skip the intro. */}
        <source src="/intro.mp4" type="video/mp4" onError={finish} />
      </video>
    </button>
  )
}
