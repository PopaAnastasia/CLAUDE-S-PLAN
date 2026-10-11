import { useEffect, useState } from 'react'
import { ArrowLeft, Check, KeyRound, LockKeyhole, ShieldQuestion } from 'lucide-react'
import { MIN_SECRET_LEN, normalizeSecret, savePhrases, unlockVault } from '../crypto/vault'
import { isSetupCode } from '../lib/access'
import { requestMotion, useShake } from '../lib/useShake'
import { input, label, masked, muted, noAssist, panel, shell, solid, topbar } from './ui'

type Values = { current: string; phrase: string; phrase2: string; decoy: string }
const empty: Values = { current: '', phrase: '', phrase2: '', decoy: '' }

// Checks the form and saves. Returns an error message, or '' on success.
async function submit(v: Values, needsCurrent: boolean): Promise<string> {
  const p = normalizeSecret(v.phrase)
  const d = normalizeSecret(v.decoy)
  if (needsCurrent && !v.current.trim()) return 'Enter your current private phrase.'
  if (p.length < MIN_SECRET_LEN || d.length < MIN_SECRET_LEN)
    return `Each phrase needs at least ${MIN_SECRET_LEN} characters.`
  if (p !== normalizeSecret(v.phrase2)) return 'The private phrases do not match.'
  if (p === d) return 'The private phrase and the decoy phrase must be different.'
  if (isSetupCode(p) || isSetupCode(d)) return 'Choose phrases that are different from the setup code.'
  let ok = false
  try {
    ok = await savePhrases(v.current, v.phrase, v.decoy)
    // Saving locks the vault, so open it again with the new private phrase.
    if (ok) ok = (await unlockVault(v.phrase)) === 'real'
  } catch {
    ok = false
  }
  return ok ? '' : needsCurrent
    ? 'Could not save. Check your current private phrase and try again.'
    : 'Could not save. Please try again.'
}

function Field({
  name, hint, value, onChange,
}: { name: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={label}>
      {name}
      <input className={`${input} ${masked} mt-1`} {...noAssist} value={value}
        onChange={(e) => onChange(e.target.value)} />
      {hint && <span className={`${muted} mt-1 block font-normal`}>{hint}</span>}
    </label>
  )
}

function PhraseFields({ v, set, withCurrent }: {
  v: Values; set: (v: Values) => void; withCurrent: boolean
}) {
  return (
    <>
      {withCurrent && (
        <Field name="Current private phrase" value={v.current} onChange={(current) => set({ ...v, current })} />
      )}
      <Field name={withCurrent ? 'New private phrase' : 'Private phrase'}
        hint="Opens your journal. Something only you would think to type."
        value={v.phrase} onChange={(phrase) => set({ ...v, phrase })} />
      <Field name="Type it again" value={v.phrase2} onChange={(phrase2) => set({ ...v, phrase2 })} />
      <Field name={withCurrent ? 'New decoy phrase' : 'Decoy phrase'}
        hint="If you are ever pressured to share a phrase, give this one. It only shows the normal help page."
        value={v.decoy} onChange={(decoy) => set({ ...v, decoy })} />
    </>
  )
}

// Full-screen first-time setup, opened only by the setup code in Help.
export function SetupPage({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [v, setV] = useState<Values>(empty)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Same quick exits as the journal: shaking the phone or pressing Esc leaves
  // setup at once and goes back to the fitness Dashboard. Nothing is saved.
  useShake(onCancel)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onCancel])

  const save = async () => {
    if (busy) return
    // Ask for motion access now, while this is still a tap, so shake-to-close
    // works on iPhone from the start.
    void requestMotion()
    setBusy(true)
    setErr('')
    const e = await submit(v, false)
    setBusy(false)
    if (e) return setErr(e)
    setV(empty)
    onDone()
  }

  return (
    <div className={`${shell} pb-10`}>
      <header className={topbar}>
        <button onClick={onCancel} className="flex items-center gap-1 text-sm" aria-label="Cancel setup">
          <ArrowLeft size={18} /> Cancel
        </button>
        <h1 className="text-base font-bold">Private setup</h1>
        <span className="w-16" />
      </header>

      <main className="space-y-4 p-4">
        <div className="rounded-2xl bg-[#d8e8db] p-5">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/70">
            <LockKeyhole size={22} className="text-[#287354]" />
          </div>
          <h2 className="text-xl font-bold">Set up your private journal</h2>
          <p className="mt-1 text-sm text-[#3d5a52]">
            Your journal stays on this phone, encrypted. Nothing is sent anywhere.
          </p>
        </div>

        <div className={`${panel} space-y-2`}>
          <p className="flex items-center gap-2 text-sm font-bold"><ShieldQuestion size={16} className="text-[#287354]" /> How you will open it</p>
          <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-[#687773]">
            <li>Open the menu and tap <strong>Help</strong>.</li>
            <li>Type your <strong>private phrase</strong> in &ldquo;Ask a question&rdquo; and tap Search.</li>
            <li>Any other text, including the decoy phrase, just shows normal help results.</li>
          </ol>
          <p className={muted}>
            Capital letters and extra spaces don&apos;t matter. After setup, the setup code stops
            working on this phone.
          </p>
        </div>

        <div className={`${panel} space-y-3`}>
          <PhraseFields v={v} set={setV} withCurrent={false} />
          {err && <p role="alert" className="rounded-xl bg-[#fbe4df] p-3 text-sm text-[#a33b26]">{err}</p>}
          <button disabled={busy} onClick={() => void save()} className={`${solid} w-full py-3`}>
            {busy ? 'Setting up…' : 'Save and open journal'}
          </button>
        </div>
      </main>
    </div>
  )
}

// Inside the journal: change both phrases. Entries stay readable.
export function ChangePhrases() {
  const [v, setV] = useState<Values>(empty)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formId, setFormId] = useState(0)

  const save = async () => {
    if (busy) return
    setBusy(true)
    setMsg('')
    const e = await submit(v, true)
    setBusy(false)
    setOk(!e)
    setMsg(e || 'Phrases updated. Use your new private phrase from now on.')
    if (!e) {
      setV(empty)
      setFormId((n) => n + 1) // fresh fields: nothing left for iPhone to "Undo"
    }
  }

  return (
    <section className={`${panel} space-y-3`}>
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-[#287354]" />
        <h3 className="text-base font-bold">Change phrases</h3>
      </div>
      <p className={muted}>Your saved entries stay readable after changing phrases.</p>
      <PhraseFields key={formId} v={v} set={setV} withCurrent />
      {msg && (
        <p role="status" className={`flex items-start gap-2 rounded-xl p-3 text-sm ${ok ? 'bg-[#d8e8db] text-[#1f5d44]' : 'bg-[#fbe4df] text-[#a33b26]'}`}>
          {ok && <Check size={16} className="mt-0.5 shrink-0" />} {msg}
        </p>
      )}
      <button disabled={busy} onClick={() => void save()} className={`${solid} w-full`}>
        {busy ? 'Saving…' : 'Save new phrases'}
      </button>
    </section>
  )
}
