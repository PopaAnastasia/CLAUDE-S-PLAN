import { useState } from 'react'
import { evaluate } from '../lib/evaluate'
import { REAL_PIN, DECOY_PIN } from '../lib/pins'
import type { ProfileData } from './Profile'
type Props = {
  onUnlock: (mode: 'real' | 'decoy') => void
  onChangeTheme: () => void
  onProfile: () => void
  profile: ProfileData
}

const ROWS = [
  ['C', '⌫', '÷', '×'],
  ['7', '8', '9', '−'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
]
const OPS = ['÷', '×', '−', '+']

export default function Calculator({ onUnlock, onChangeTheme, onProfile, profile }: Props) {
  const [expr, setExpr] = useState('')
  const [fresh, setFresh] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const press = (k: string) => {
    if (expr === 'Error') setExpr('')
    const cur = expr === 'Error' ? '' : expr

    if (k === 'C') { setExpr(''); setFresh(false); return }
    if (k === '⌫') { setExpr(cur.slice(0, -1)); setFresh(false); return }

    if (k === '=') {
      // PIN trapdoor: exactly 6 digits then "="
      if (/^\d{6}$/.test(cur)) {
        if (cur === REAL_PIN) { setExpr(''); onUnlock('real'); return }
        if (cur === DECOY_PIN) { setExpr(''); onUnlock('decoy'); return }
      }
      setExpr(evaluate(cur))
      setFresh(true)
      return
    }

    if (OPS.includes(k)) {
      if (cur === '' && k !== '−') return
      const base = OPS.includes(cur.slice(-1)) ? cur.slice(0, -1) : cur
      setExpr(base + k)
      setFresh(false)
      return
    }

    // digit or "."
    if (cur.length >= 30) return
    if (fresh) { setExpr(k === '.' ? '0.' : k); setFresh(false); return }
    setExpr(cur + k)
  }

  const btn = 'h-16 rounded-2xl text-2xl font-medium active:opacity-70'
  const style = (k: string) =>
    k === '=' ? 'bg-orange-500 text-white'
    : OPS.includes(k) ? 'bg-orange-100 text-orange-600'
    : ['C', '⌫'].includes(k) ? 'bg-slate-300 text-slate-800'
    : 'bg-white text-slate-900'

  return (
    <div className="relative min-h-screen bg-slate-100">
      <header className="mx-auto flex max-w-md items-center justify-between bg-white px-4 py-3 shadow-sm">
        <button
          aria-label="Open menu"
          className="text-2xl text-slate-700"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-slate-700">Calculator</h1>
        <button
          aria-label="Open profile"
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: profile.color }}
          onClick={onProfile}
        >
          {(profile.firstName[0] || 'U').toUpperCase()}
        </button>
      </header>
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 z-30 flex h-full w-72 flex-col bg-white shadow-2xl">
            <button className="w-full p-6 text-left text-white" style={{ backgroundColor: profile.color }} onClick={onProfile}>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold">{(profile.firstName[0] || 'U').toUpperCase()}</div>
              <h2 className="text-lg font-bold">{profile.firstName || 'My Profile'}</h2>
              <p className="mt-1 text-xs text-white/80">App preferences</p>
            </button>
            <nav className="p-4">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setMenuOpen(false)
                  onChangeTheme()
                }}
              >
                <span className="w-5 text-center">🎨</span>
                <span>Change Theme</span>
              </button>
              <button
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                <span className="w-5 text-center">×</span>
                <span>Close</span>
              </button>
            </nav>
          </aside>
        </>
      )}
      <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-md flex-col justify-end p-4">
      <div className="text-right text-5xl font-light text-slate-900 break-all min-h-[4rem] mb-4">
        {expr || '0'}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {ROWS.flat().map((k) => (
          <button key={k} className={`${btn} ${style(k)}`} onClick={() => press(k)}>
            {k}
          </button>
        ))}
        <button className={`${btn} bg-white text-slate-900 col-span-3`} onClick={() => press('0')}>0</button>
        <button className={`${btn} bg-white text-slate-900`} onClick={() => press('.')}>.</button>
      </div>
      </div>
    </div>
  )
}