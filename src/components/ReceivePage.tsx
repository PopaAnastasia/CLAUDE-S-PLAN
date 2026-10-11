import { useState } from 'react'
import { decryptBundle, isValidCode } from '../lib/bundle'
import { verifyEntries, type BundleEntry, type ExportRow, type Item, type Verify } from '../lib/chain'
import { buildPdf, downloadPdf } from '../lib/exportPdf'
import EntryCard from './EntryCard'

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
    <div className="mx-auto min-h-screen max-w-md space-y-4 bg-slate-50 p-4 text-slate-800">
      <h1 className="text-xl font-bold">Open a shared record</h1>
      {!open ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Choose the backup file you were given and type the five-word code. Everything is opened
            on this device; nothing is uploaded.
          </p>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="five-word code"
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={go} disabled={busy || !file || !isValidCode(code)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? 'Opening…' : 'Open'}
          </button>
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className={`rounded-lg p-3 text-sm ${open.check.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
            {open.check.ok
              ? `Integrity check passed for ${open.check.count} entries: nothing was changed after it was saved.`
              : `Integrity check FAILED: ${open.check.problem}`}
          </p>
          {open.check.notices.map((n) => <p key={n} className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{n}</p>)}
          <p className="text-xs text-slate-500">
            Times come from the phone&apos;s clock and were not independently verified. The check shows
            the entries are unchanged since saving; it does not prove that the events happened.
          </p>
          <button onClick={pdf} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Export PDF</button>
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
    </div>
  )
}
