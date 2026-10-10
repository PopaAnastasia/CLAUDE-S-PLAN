import { useState } from 'react'
import { evaluate } from '../lib/evaluate'
import { REAL_PIN, DECOY_PIN } from '../lib/pins'
type Props = { onUnlock: (mode: 'real' | 'decoy') => void }

const ROWS = [
  ['C', '⌫', '÷', '×'],
  ['7', '8', '9', '−'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
]
const OPS = ['÷', '×', '−', '+']

export default function Calculator({ onUnlock }: Props) {
  const [expr, setExpr] = useState('')
  const [fresh, setFresh] = useState(false)

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-end p-4 max-w-md mx-auto">
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
  )
}