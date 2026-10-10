import { useState } from 'react'
import { MIN_SECRET_LEN, normalizeSecret, savePhrases } from '../crypto/vault'
import { card, field, primary, useStored } from './data'

// Hides typed characters without using a password field, which would make
// the browser offer to "save password" and leave a visible trace.
const mask = '[-webkit-text-security:disc]'
const off = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
} as const

export default function ProfilePage() {
  const [name, setName] = useStored<string>('fit.name', '')
  const [current, setCurrent] = useState('')
  const [phrase, setPhrase] = useState('')
  const [phrase2, setPhrase2] = useState('')
  const [recovery, setRecovery] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  const fail = (text: string) => {
    setOk(false)
    setMsg(text)
  }

  const save = async () => {
    if (busy) return
    const p = normalizeSecret(phrase)
    const r = normalizeSecret(recovery)
    if (p.length < MIN_SECRET_LEN || r.length < MIN_SECRET_LEN) {
      fail(`Each phrase needs at least ${MIN_SECRET_LEN} characters.`)
      return
    }
    if (p !== normalizeSecret(phrase2)) {
      fail('The two security phrases do not match.')
      return
    }
    if (p === r) {
      fail('The two phrases must be different.')
      return
    }
    setBusy(true)
    setMsg('')
    let saved = false
    try {
      saved = await savePhrases(current, phrase, recovery)
    } catch {
      saved = false
    }
    setBusy(false)
    if (saved) {
      setCurrent('')
      setPhrase('')
      setPhrase2('')
      setRecovery('')
      setOk(true)
      setMsg('Saved.')
    } else {
      fail('Could not save. Check your entries and try again.')
    }
  }

  const label = 'block text-xs font-medium text-slate-600'

  return (
    <>
      <div className={`${card} space-y-2`}>
        <p className="font-bold text-slate-700">Profile</p>
        <input
          className={field}
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={`${card} space-y-3`}>
        <p className="font-bold text-slate-700">Security</p>
        <p className="text-xs text-slate-500">
          Optional. Used to verify your identity when you contact Help.
        </p>

        <label className={label}>
          Current security phrase
          <input
            className={`${field} ${mask} mt-1`}
            {...off}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <p className="text-xs text-slate-400">Leave blank if you have not set one yet.</p>

        <label className={label}>
          New security phrase
          <input
            className={`${field} ${mask} mt-1`}
            {...off}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
        </label>

        <label className={label}>
          Confirm security phrase
          <input
            className={`${field} ${mask} mt-1`}
            {...off}
            value={phrase2}
            onChange={(e) => setPhrase2(e.target.value)}
          />
        </label>

        <label className={label}>
          Recovery phrase
          <input
            className={`${field} ${mask} mt-1`}
            {...off}
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
          />
        </label>

        {msg && (
          <p className={`text-sm ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg}</p>
        )}
        <button
          disabled={busy}
          onClick={() => void save()}
          className={`${primary} w-full disabled:opacity-60`}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}