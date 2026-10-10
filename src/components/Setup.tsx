import { useState } from 'react'
import { MIN_SECRET_LEN, normalizeSecret, setupVault } from '../crypto/vault'

export default function Setup({ onDone }: { onDone: () => void }) {
  const [real, setReal] = useState('')
  const [real2, setReal2] = useState('')
  const [decoy, setDecoy] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const r = normalizeSecret(real)
    const r2 = normalizeSecret(real2)
    const d = normalizeSecret(decoy)
    if (r.length < MIN_SECRET_LEN || d.length < MIN_SECRET_LEN) {
      setError(`Each phrase needs at least ${MIN_SECRET_LEN} characters.`)
      return
    }
    if (r !== r2) {
      setError('The two entries of your private phrase do not match.')
      return
    }
    if (r === d) {
      setError('The two phrases must be different.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await setupVault(real, decoy)
      onDone()
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base'
  const off = {
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
  } as const

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center gap-4 p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">Set up Help access</h1>
      <p className="text-slate-600 text-sm">
        Choose two different phrases that sound like ordinary questions, for
        example &quot;how do i change my step goal&quot;. Capital letters and
        extra spaces are ignored. If you forget your private phrase, nothing
        can be recovered.
      </p>

      <label className="text-sm font-medium text-slate-700">
        Private phrase (opens your private space)
        <input className={input} {...off} value={real}
          onChange={(e) => setReal(e.target.value)} />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Type your private phrase again
        <input className={input} {...off} value={real2}
          onChange={(e) => setReal2(e.target.value)} />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Backup phrase (opens a harmless help page)
        <input className={input} {...off} value={decoy}
          onChange={(e) => setDecoy(e.target.value)} />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button disabled={busy} onClick={submit}
        className="rounded-xl bg-slate-800 text-white py-3 disabled:opacity-50">
        {busy ? 'Setting up…' : 'Save'}
      </button>
    </div>
  )
}