import { useState } from 'react'
import { Check, Palette, UserRound } from 'lucide-react'
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

const colorChoices = [
  { name: 'Violet', value: '#5d43d6' },
  { name: 'Coral', value: '#e66c52' },
  { name: 'Forest', value: '#287354' },
  { name: 'Navy', value: '#193c36' },
]

export default function ProfilePage({
  accentColor,
  setAccentColor,
}: {
  accentColor: string
  setAccentColor: (value: string) => void
}) {
  const [name, setName] = useStored<string>('fit.name', '')
  const [bio, setBio] = useStored<string>('fit.bio', '')
  const [focus, setFocus] = useStored<string>('fit.focus', 'Build consistency')
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

  const label = 'block text-xs font-medium text-[#193c36]'

  return (
    <>
      <div className={`${card} space-y-4 bg-[#f9ddd4]`}>
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl text-xl font-bold text-white" style={{ backgroundColor: accentColor }}>
            {(name.trim()[0] || 'U').toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#d65d46]">Your space</p>
            <p className="text-lg font-bold text-[#193c36]">{name.trim() || 'Your profile'}</p>
          </div>
        </div>
        <input
          className={field}
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className={label}>
          Bio
          <textarea
            className={`${field} mt-1 min-h-20 resize-none`}
            placeholder="A short note about what keeps you moving"
            maxLength={140}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <span className="mt-1 block text-right text-[10px] text-[#89928f]">{bio.length}/140</span>
        </label>
      </div>

      <div className={`${card} space-y-3 bg-[#d8e8db]`}>
        <div className="flex items-center gap-2">
          <UserRound size={18} className="text-[#287354]" />
          <p className="font-bold text-[#193c36]">Your focus</p>
        </div>
        <p className="text-xs text-[#687773]">Choose the reminder that best fits your routine.</p>
        <div className="grid grid-cols-2 gap-2">
          {['Build consistency', 'Move more', 'Feel stronger', 'Rest well'].map((option) => (
            <button
              key={option}
              onClick={() => setFocus(option)}
              className={`rounded-xl px-2 py-2 text-xs font-semibold ${focus === option ? 'bg-[#287354] text-white' : 'bg-white/70 text-[#193c36]'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={`${card} space-y-3 bg-[#f6df9a]`}>
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-[#725a17]" />
          <p className="font-bold text-[#193c36]">App color</p>
        </div>
        <p className="text-xs text-[#687773]">Pick an accent for your header, avatar, and navigation.</p>
        <div className="flex flex-wrap gap-2">
          {colorChoices.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              aria-label={`Use ${color.name} theme`}
              className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-[#193c36]"
            >
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }} />
              {color.name}
              {accentColor === color.value && <Check size={14} />}
            </button>
          ))}
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-[#193c36]">
            <span className="h-4 w-4 rounded-full border border-[#89928f]" style={{ backgroundColor: accentColor }} />
            Custom
            <input type="color" className="sr-only" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </label>
        </div>
      </div>

      <div className={`${card} space-y-3 bg-[#ded9eb]`}>
        <p className="font-bold text-[#193c36]">Security</p>
        <p className="text-xs text-[#687773]">
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