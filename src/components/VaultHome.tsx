import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck, FileDown, X, Mic, Square, Paperclip, Camera, LifeBuoy, Archive } from 'lucide-react'
import {
  addItem, listItems, verifyChain, MAX_FILE, type Item, type Kind, type NewItem, type Verify,
} from '../storage/evidence'
import { exportPdf } from '../lib/exportPdf'
import { graceLock, holdLock } from '../lib/lockGrace'
import { useShake } from '../lib/useShake'
import { fmtSize } from '../lib/format'
import EntryCard from './EntryCard'
import { SavedNotice, SubmitWarning } from './Dialogs'
import Resources from './Resources'
import Backup from './Backup'

type View = 'log' | 'resources' | 'backup'
type Pending = { entries: NewItem[]; label: string }

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
const primary = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'
const ghost = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700'

const kindOf = (mime: string): Kind | null =>
  mime.startsWith('image/') ? 'photo' : mime.startsWith('audio/') ? 'audio' : mime.startsWith('video/') ? 'video' : null

export default function VaultHome({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('log')
  const [items, setItems] = useState<Item[]>([])
  const [mode, setMode] = useState<'note' | 'chat'>('note')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [when, setWhen] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [check, setCheck] = useState<Verify | null>(null)
  const [recording, setRecording] = useState(false)
  const recRef = useRef<{ rec: MediaRecorder; stream: MediaStream; start: string; release: () => void } | null>(null)
  const shake = useShake(onClose)

  const refresh = useCallback(async () => {
    try { setItems(await listItems()) } catch { setError('Could not read the journal.') }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending && !saved) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose, pending, saved])

  // Never auto-lock while a confirmation or save is open.
  useEffect(() => {
    if (!pending && !saved) return
    return holdLock()
  }, [pending, saved])

  useEffect(() => () => {
    const r = recRef.current
    if (r) { r.rec.state !== 'inactive' && r.rec.stop(); r.stream.getTracks().forEach((t) => t.stop()); r.release() }
  }, [])

  const happened = () => (when ? new Date(when).toISOString() : undefined)

  const stageText = () => {
    if (!text.trim()) return
    setPending({
      label: mode,
      entries: [{
        kind: mode,
        title: title.trim() || (mode === 'note' ? 'Note' : 'Chat / message'),
        text: text.trim(),
        happenedAt: happened(),
      }],
    })
  }

  const stageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const entries: NewItem[] = []
    const skipped: string[] = []
    for (const f of Array.from(files)) {
      const kind = kindOf(f.type)
      if (!kind) { skipped.push(`${f.name} (type not supported)`); continue }
      if (f.size > MAX_FILE) { skipped.push(`${f.name} (over ${fmtSize(MAX_FILE)})`); continue }
      entries.push({
        kind, title: f.name, file: f,
        capturedAt: f.lastModified ? new Date(f.lastModified).toISOString() : undefined,
        capturedFrom: 'file',
        happenedAt: happened(),
      })
    }
    setError(skipped.length ? `Skipped: ${skipped.join(', ')}` : '')
    if (entries.length) setPending({ label: 'files', entries })
  }

  const startRec = async () => {
    setError('')
    try {
      graceLock()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks: Blob[] = []
      const start = new Date().toISOString()
      const release = holdLock()
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        release()
        recRef.current = null
        setRecording(false)
        const type = rec.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type })
        if (blob.size === 0) return
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        setPending({
          label: 'recording',
          entries: [{
            kind: 'audio', title: 'Audio recording', file: blob,
            fileName: `recording-${start.replace(/[:.]/g, '-')}.${ext}`,
            capturedAt: start, capturedFrom: 'recording', happenedAt: happened(),
          }],
        })
      }
      rec.start()
      recRef.current = { rec, stream, start, release }
      setRecording(true)
    } catch {
      setError('Could not use the microphone. Check the browser permission.')
    }
  }
  const stopRec = () => recRef.current?.rec.stop()

  const confirm = async () => {
    if (!pending) return
    setSaving(true)
    setError('')
    try {
      for (const e of pending.entries) await addItem(e)
      setPending(null)
      setTitle(''); setText(''); setWhen('')
      setSaved(true)
      await refresh()
    } catch {
      setPending(null)
      setError('Could not save. Nothing was changed. Try again.')
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const verify = async () => { setCheck(null); setCheck(await verifyChain()) }
  const pdf = async () => { try { await exportPdf() } catch { setError('Could not create the PDF.') } }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-10 text-slate-800">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
        <h1 className="text-lg font-bold">Journal</h1>
        <button onClick={onClose} aria-label="Close journal" className="flex items-center gap-1 text-sm">
          <X size={18} /> Close
        </button>
      </header>

      <nav className="flex gap-2 p-3 text-sm">
        {([['log', 'Log', ShieldCheck], ['backup', 'Backup', Archive], ['resources', 'Resources', LifeBuoy]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium ${view === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      <main className="space-y-4 px-3">
        {view === 'resources' && <Resources />}
        {view === 'backup' && <Backup onChanged={() => { void refresh(); setView('log') }} />}

        {view === 'log' && (
          <>
            <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex gap-2 text-sm">
                {(['note', 'chat'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`rounded-full px-3 py-1 ${mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                    {m === 'note' ? 'Note' : 'Paste a chat / message'}
                  </button>
                ))}
              </div>
              <input className={field} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className={field} rows={5} value={text} onChange={(e) => setText(e.target.value)}
                placeholder={mode === 'note' ? 'What happened?' : 'Paste the messages here'} />
              <label className="block text-xs text-slate-500">
                When did this happen? (optional; kept as you enter it)
                <input type="datetime-local" className={`${field} mt-1`} value={when} onChange={(e) => setWhen(e.target.value)} />
              </label>
              <button className={primary} disabled={!text.trim()} onClick={stageText}>Review and save</button>
            </section>

            <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold">Photos, audio and video</p>
              <div className="flex flex-wrap gap-2">
                <label className={`${ghost} cursor-pointer`}>
                  <Paperclip size={14} className="mr-1 inline" /> Add files
                  <input type="file" multiple accept="image/*,audio/*,video/*" className="hidden"
                    onClick={() => graceLock()}
                    onChange={(e) => { stageFiles(e.target.files); e.target.value = '' }} />
                </label>
                <label className={`${ghost} cursor-pointer`}>
                  <Camera size={14} className="mr-1 inline" /> Camera
                  <input type="file" accept="image/*,video/*" capture="environment" className="hidden"
                    onClick={() => graceLock()}
                    onChange={(e) => { stageFiles(e.target.files); e.target.value = '' }} />
                </label>
                {recording ? (
                  <button onClick={stopRec} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white">
                    <Square size={14} className="mr-1 inline" /> Stop recording
                  </button>
                ) : (
                  <button onClick={startRec} className={ghost}><Mic size={14} className="mr-1 inline" /> Record audio</button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Each file is dated with when it was recorded or last modified, and when you saved it. Max {fmtSize(MAX_FILE)} each.
              </p>
            </section>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

            <section className="flex flex-wrap gap-2">
              <button onClick={verify} className={ghost}><ShieldCheck size={14} className="mr-1 inline" /> Verify entries</button>
              <button onClick={pdf} className={ghost}><FileDown size={14} className="mr-1 inline" /> Export PDF</button>
            </section>
            {check && (
              <div role="status" className={`rounded-lg p-3 text-sm ${check.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                {check.ok ? `All ${check.count} entries are unchanged since they were saved.` : `Problem found: ${check.problem}`}
                {check.notices.map((n) => <p key={n} className="mt-1 text-xs">{n}</p>)}
              </div>
            )}

            <ul className="space-y-2">
              {items.length === 0 && <li className="text-sm text-slate-500">No entries yet.</li>}
              {items.map((it, i) => <EntryCard key={it.id} item={it} seq={items.length - i} />)}
            </ul>

            <p className="text-xs text-slate-500">
              Entries can&apos;t be edited or deleted here. Times come from this phone&apos;s clock and aren&apos;t
              independently verified. The check shows whether entries changed after saving, not that events happened.
              Clearing this browser&apos;s site data would remove everything, so keep a backup elsewhere.
            </p>

            {shake.supported && (
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={shake.on} className="mt-0.5"
                  onChange={(e) => (e.target.checked ? void shake.enable() : shake.disable())} />
                <span>
                  Quick exit: shake the phone to close the journal.
                  {!shake.granted && ' Motion permission was not allowed.'}
                </span>
              </label>
            )}
          </>
        )}
      </main>

      {pending && (
        <SubmitWarning count={pending.entries.length} busy={saving}
          onCancel={() => setPending(null)} onConfirm={confirm} />
      )}
      {saved && (
        <SavedNotice onDone={() => setSaved(false)}
          onBackup={() => { setSaved(false); setView('backup') }} />
      )}
    </div>
  )
}
