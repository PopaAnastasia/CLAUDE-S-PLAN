import { useState } from 'react'
import { decryptBundle, isValidCode } from '../lib/bundle'
import { verifyEntries, type BundleEntry, type ExportRow, type Item, type Verify } from '../lib/chain'
import { buildPdf, downloadPdf } from '../lib/exportPdf'
import { FileDown, FolderLock, ShieldAlert, ShieldCheck } from 'lucide-react'
import EntryCard from './EntryCard'
import { fileInput, input, muted, panel, shell, solid, topbar } from './ui'

type Opened = { entries: BundleEntry[]; items: ExportRow[]; check: Verify }

// Opens a shared backup. No account, no journal and no upload: it all happens in this browser.
export default function ReceivePage() {
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<Opened | null>(null)

  const go = async () => {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      const entries = await decryptBundle(new Uint8Array(await file.arrayBuffer()), code)
      const check = await verifyEntries(entries)
      const items: ExportRow[] = entries.map((e) => ({
        ...(JSON.parse(e.plain) as Item),
        seq: e.seq,
        entryHash: e.entryHash,
      }))
      setOpen({ entries, items, check })
    } catch {
      setErr('Could not open it. Check the code and the file.')
    } finally {
      setBusy(false)
    }
  }

  const pdf = async () => {
    if (!open) return
    downloadPdf(await buildPdf(open.items, open.check, 'Shared incident record'), 'incident-record.pdf')
  }

  return (
    <div className={`${shell} pb-12`}>
      <header className={topbar}>
        <h1 className="text-lg font-bold">Open a shared record</h1>
      </header>
      <main className="space-y-4 p-4">
      {!open ? (
        <div className={`${panel} space-y-4`}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d8e8db]"><FolderLock size={22} className="text-[#287354]" /></span>
            <p className="text-sm leading-relaxed text-[#687773]">
              Choose the backup file you were given and type the five-word code. Everything is opened
              on this device; nothing is uploaded.
            </p>
          </div>
          <label className="block text-xs font-semibold">
            Backup file
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={`${fileInput} mt-1`} />
          </label>
          <label className="block text-xs font-semibold">
            Five-word code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="word-word-word-word-word"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              className={`${input} mt-1 font-mono`} />
          </label>
          <button onClick={go} disabled={busy || !file || !isValidCode(code)} className={`${solid} w-full py-2.5`}>
            {busy ? 'Opening…' : 'Open record'}
          </button>
          {err && <p role="alert" className="rounded-xl bg-[#fbe4df] p-3 text-sm text-[#a33b26]">{err}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`flex gap-3 rounded-2xl p-4 text-sm ${open.check.ok ? 'bg-[#d8e8db] text-[#1f5d44]' : 'bg-[#fbe4df] text-[#a33b26]'}`}>
            {open.check.ok ? <ShieldCheck size={22} className="shrink-0" /> : <ShieldAlert size={22} className="shrink-0" />}
            <p>
              {open.check.ok
                ? `Integrity check passed for ${open.check.count} entries: nothing was changed after it was saved.`
                : `Integrity check FAILED: ${open.check.problem}`}
            </p>
          </div>
          {open.check.notices.map((n) => <p key={n} className="rounded-xl bg-[#fbf0d2] p-3 text-xs text-[#6b5414]">{n}</p>)}
          <p className={muted}>
            Times come from the phone&apos;s clock and were not independently verified. The check shows
            the entries are unchanged since saving; it does not prove that the events happened.
          </p>
          <button onClick={pdf} className={`${solid} w-full`}><FileDown size={16} /> Export PDF</button>
          <ul className="space-y-2">
            {[...open.entries].reverse().map((e) => {
              const it = open.items.find((i) => i.seq === e.seq)!
              const loader = e.file
                ? async () => ({ blob: new Blob([e.file!], { type: it.mime || 'application/octet-stream' }), name: it.fileName || 'file' })
                : undefined
              return <EntryCard key={e.seq} item={it} seq={e.seq} loader={loader} />
            })}
          </ul>
        </div>
      )}
      </main>
    </div>
  )
}
