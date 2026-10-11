import { useEffect, useRef, useState } from 'react'
import { Check, Download, KeyRound, Upload } from 'lucide-react'
import { countItems, readAllEntries, restoreEntries } from '../storage/evidence'
import { decryptBundle, encryptBundle, isValidCode, makeCode, MAX_BUNDLE } from '../lib/bundle'
import { verifyEntries } from '../lib/chain'
import { graceLock, holdLock } from '../lib/lockGrace'

import { fileInput, input, muted, panel, solid } from './ui'

export default function Backup({ onChanged }: { onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [backup, setBackup] = useState<{ code: string; url: string; name: string } | null>(null)
  const [msg, setMsg] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [typed, setTyped] = useState('')
  const holdRef = useRef<(() => void) | null>(null)

  // Keep the one-time code on screen without auto-locking; release the hold when
  // the user is done or leaves this tab.
  useEffect(() => () => { holdRef.current?.() }, [])

  // Step 1: make the file and the code, and SHOW the code first. The file is only
  // downloaded when the user taps "Download backup file" (step 2). On iPhone the
  // download sends the app to the background and reloads it, which would wipe the
  // one-time code, so the code must be read before the download is triggered.
  const make = async () => {
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
      const url = URL.createObjectURL(blob)
      const name = `shake-backup-${new Date().toISOString().slice(0, 10)}.dfb`
      holdRef.current?.()
      holdRef.current = holdLock() // stay unlocked while the code is on screen
      setBackup({ code: c, url, name })
    } catch {
      setMsg('Could not create the backup. The journal may be too large (limit about 120 MB).')
    } finally {
      setBusy(false)
    }
  }

  // Step 2: save the file. graceLock keeps it from locking during the hand-off.
  const download = () => {
    if (!backup) return
    graceLock()
    const a = document.createElement('a')
    a.href = backup.url
    a.download = backup.name
    a.click()
  }

  const doneBackup = () => {
    holdRef.current?.()
    holdRef.current = null
    if (backup) URL.revokeObjectURL(backup.url)
    setBackup(null)
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
    <div className="space-y-4">
      <section className={`${panel} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8e8db]"><Download size={20} className="text-[#287354]" /></span>
          <h3 className="text-base font-bold">Create an encrypted backup</h3>
        </div>
        <p className={muted}>
          Saves one file with everything in your journal. It is locked with a one-time code of five
          words generated for this backup. Give the file to someone you trust, and tell them the
          code in a different way (in person or by phone), not in the same message.
        </p>
        {!backup ? (
          <button onClick={make} disabled={busy} className={`${solid} w-full`}>
            <Download size={16} /> {busy ? 'Working…' : 'Create backup'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#9cc7ae] bg-[#eef6f0] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1f5d44]">
                <KeyRound size={14} /> Step 1 — write down this code. It is shown only now and is not stored anywhere:
              </p>
              <p className="mt-2 select-all break-words rounded-lg bg-white p-3 text-center font-mono text-lg font-bold tracking-wide">{backup.code}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#1f5d44]">
                Keep it somewhere separate from the file. If you lose the code, the file can&apos;t be opened.
              </p>
            </div>
            <div className="rounded-xl bg-[#f5f3ed] p-3">
              <p className="text-xs font-semibold text-[#193c36]">Step 2 — save the backup file:</p>
              <button onClick={download} className={`${solid} mt-2 w-full`}>
                <Download size={16} /> Download backup file
              </button>
              <p className="mt-2 text-xs leading-relaxed text-[#687773]">
                The person opens the app link, goes to <span className="font-mono">/#/receive</span>,
                chooses the file and types the code.
              </p>
            </div>
            <button onClick={doneBackup} className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-[#287354]">
              <Check size={14} /> I&apos;ve saved the code and the file
            </button>
          </div>
        )}
      </section>

      <section className={`${panel} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ded9eb]"><Upload size={20} className="text-[#523acb]" /></span>
          <h3 className="text-base font-bold">Restore on a new phone</h3>
        </div>
        <p className={muted}>
          Only works when this journal is empty, so nothing already saved can be overwritten.
        </p>
        <input type="file" onClick={() => graceLock()} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={fileInput} />
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Five-word code"
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className={input} />
        <button onClick={restore} disabled={busy || !file || !isValidCode(typed)} className={`${solid} w-full`}>
          <Upload size={16} /> Restore
        </button>
      </section>
      {msg && <p role="status" className="rounded-xl bg-[#ecebe3] p-3 text-sm">{msg}</p>}
    </div>
  )
}
