import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { countItems, readAllEntries, restoreEntries } from '../storage/evidence'
import { decryptBundle, encryptBundle, isValidCode, makeCode, MAX_BUNDLE } from '../lib/bundle'
import { verifyEntries } from '../lib/chain'
import { graceLock, holdLock } from '../lib/lockGrace'

const btn = 'rounded-lg px-4 py-2 text-sm font-medium'
const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50`

export default function Backup({ onChanged }: { onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [typed, setTyped] = useState('')

  const make = async () => {
    const release = holdLock()
    setBusy(true)
    setMsg('')
    try {
      const entries = await readAllEntries()
      if (entries.length === 0) {
        setMsg('There is nothing to back up yet.')
        return
      }
      const c = makeCode()
      const bytes = await encryptBundle(entries, c)
      const blob = new Blob([bytes], { type: 'application/octet-stream' })
      const u = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u
      a.download = `daily-fit-backup-${new Date().toISOString().slice(0, 10)}.dfb`
      a.click()
      setTimeout(() => URL.revokeObjectURL(u), 10_000)
      setCode(c)
    } catch {
      setMsg('Could not create the backup. The journal may be too large (limit about 120 MB).')
    } finally {
      setBusy(false)
      release()
    }
  }

  const restore = async () => {
    if (!file) return
    const release = holdLock()
    setBusy(true)
    setMsg('')
    try {
      if ((await countItems()) > 0) {
        setMsg('Restore only works on an empty journal, so nothing is ever overwritten. Use the Receive page to view a backup instead.')
        return
      }
      if (file.size > MAX_BUNDLE + 1024) {
        setMsg('That file is too large.')
        return
      }
      const entries = await decryptBundle(new Uint8Array(await file.arrayBuffer()), typed)
      const v = await verifyEntries(entries)
      if (!v.ok) {
        setMsg(`This backup failed its integrity check: ${v.problem}`)
        return
      }
      await restoreEntries(entries)
      setMsg(`Restored ${entries.length} entries.`)
      onChanged()
    } catch {
      setMsg('Could not open it. Check the code and the file.')
    } finally {
      setBusy(false)
      release()
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="font-semibold">Create an encrypted backup</h3>
        <p className="text-xs text-slate-500">
          Saves one file with everything in your journal. It is locked with a one-time code of five
          words generated for this backup. Give the file to someone you trust, and tell them the
          code in a different way (in person or by phone), not in the same message.
        </p>
        <button onClick={make} disabled={busy} className={primary}>
          <Download size={14} className="mr-1 inline" /> {busy ? 'Working…' : 'Create backup'}
        </button>
        {code && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-900">Your code. It is shown only now; it is not stored anywhere:</p>
            <p className="mt-1 select-all break-words font-mono text-lg font-bold">{code}</p>
            <p className="mt-1 text-xs text-emerald-900">
              The person opens the app link, then goes to <span className="font-mono">/#/receive</span>,
              chooses the file and types the code. If you lose the code, the file can&apos;t be opened.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="font-semibold">Restore on a new phone</h3>
        <p className="text-xs text-slate-500">
          Only works when this journal is empty. Set your phrases in Profile first, then restore.
        </p>
        <input type="file" onClick={() => graceLock()} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm" />
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="five-word code"
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={restore} disabled={busy || !file || !isValidCode(typed)} className={primary}>
          <Upload size={14} className="mr-1 inline" /> Restore
        </button>
      </section>
      {msg && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">{msg}</p>}
    </div>
  )
}
