import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive, Camera, FileDown, LifeBuoy, Mic, NotebookPen, Paperclip, Settings2, ShieldCheck, Square, Vibrate, X,
} from 'lucide-react'
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
import { ChangePhrases } from './Phrases'
import { input, muted, panel, shell, soft, solid, topbar } from './ui'

type View = 'log' | 'backup' | 'resources' | 'settings'
type Pending = { entries: NewItem[]; label: string }

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
  // Replaced after each save so iPhone has no old typing to "Undo" on shake.
  const [formId, setFormId] = useState(0)
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
      setTitle(''); setText(''); setWhen(''); setFormId((n) => n + 1)
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

  const tabs = [
    ['log', 'Log', NotebookPen],
    ['backup', 'Backup', Archive],
    ['resources', 'Get help', LifeBuoy],
    ['settings', 'Settings', Settings2],
  ] as const

  return (
    <div className={`${shell} pb-12`}>
      <header className={topbar}>
        <div>
          <h1 className="text-lg font-bold leading-tight">Journal</h1>
          <p className="text-[11px] text-[#b9d3c4]">
            {items.length === 1 ? '1 entry' : `${items.length} entries`} · stored only on this phone
          </p>
        </div>
        <button onClick={onClose} aria-label="Close journal"
          className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25">
          <X size={16} /> Close
        </button>
      </header>

      <nav className="sticky top-[60px] z-10 grid grid-cols-4 gap-1 border-b border-[#e5e6df] bg-[#f5f3ed]/95 p-2 backdrop-blur">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${view === id ? 'bg-white text-[#287354] shadow-sm' : 'text-[#89928f] hover:text-[#193c36]'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      <main className="space-y-4 p-4">
        {view === 'resources' && <Resources />}
        {view === 'backup' && <Backup onChanged={() => { void refresh(); setView('log') }} />}

        {view === 'settings' && (
          <>
            <ChangePhrases />
            <section className={`${panel} space-y-2`}>
              <div className="flex items-center gap-2">
                <Vibrate size={18} className="text-[#287354]" />
                <h3 className="text-base font-bold">Quick exit</h3>
              </div>
              {shake.supported ? (
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={shake.on} className="mt-1 h-4 w-4 accent-[#287354]"
                    onChange={(e) => (e.target.checked ? void shake.enable() : shake.disable())} />
                  <span>
                    Shake the phone firmly (about three quick shakes) to close the journal and go back to the fitness dashboard. On by default.
                    {shake.denied && <span className="block text-xs text-[#a33b26]">Motion access was not allowed, so shake can&apos;t work. You can allow it in your browser settings.</span>}
                  </span>
                </label>
              ) : (
                <p className={muted}>Shake to close isn&apos;t available on this device or browser.</p>
              )}
              <p className={muted}>
                The journal also closes when you press Close or Esc, switch apps, or leave it untouched for 2 minutes.
              </p>
            </section>
          </>
        )}

        {view === 'log' && (
          <>
            {shake.needsTap && (
              <button onClick={() => void shake.enable()}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#d8e8db] p-3 text-left text-sm">
                <Vibrate size={20} className="shrink-0 text-[#287354]" />
                <span>
                  <span className="block font-semibold">Turn on shake to exit</span>
                  <span className="block text-xs text-[#3d5a52]">Tap once so your phone allows it. Then shaking the phone closes the journal.</span>
                </span>
              </button>
            )}
            <section className={`${panel} space-y-3`}>
              <div className="flex rounded-xl bg-[#f5f3ed] p-1 text-sm">
                {(['note', 'chat'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg py-1.5 font-semibold transition ${mode === m ? 'bg-white text-[#193c36] shadow-sm' : 'text-[#89928f]'}`}>
                    {m === 'note' ? 'Write a note' : 'Paste messages'}
                  </button>
                ))}
              </div>
              <input key={`t${formId}`} className={input} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea key={`x${formId}`} className={`${input} resize-none`} rows={5} value={text} onChange={(e) => setText(e.target.value)}
                placeholder={mode === 'note' ? 'What happened?' : 'Paste the messages here'} />
              <label className="block text-xs font-semibold text-[#193c36]">
                When did this happen? <span className="font-normal text-[#89928f]">Optional, kept exactly as you enter it</span>
                <input type="datetime-local" className={`${input} mt-1`} value={when} onChange={(e) => setWhen(e.target.value)} />
              </label>
              <button className={`${solid} w-full py-2.5`} disabled={!text.trim()} onClick={stageText}>Review and save</button>
            </section>

            <section className={`${panel} space-y-3`}>
              <p className="text-sm font-bold">Photos, audio and video</p>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl bg-[#f5f3ed] py-3 text-xs font-semibold hover:bg-[#ecebe3]">
                  <Paperclip size={20} className="text-[#287354]" /> Add files
                  <input type="file" multiple accept="image/*,audio/*,video/*" className="hidden"
                    onClick={() => graceLock()}
                    onChange={(e) => { stageFiles(e.target.files); e.target.value = '' }} />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl bg-[#f5f3ed] py-3 text-xs font-semibold hover:bg-[#ecebe3]">
                  <Camera size={20} className="text-[#287354]" /> Camera
                  <input type="file" accept="image/*,video/*" capture="environment" className="hidden"
                    onClick={() => graceLock()}
                    onChange={(e) => { stageFiles(e.target.files); e.target.value = '' }} />
                </label>
                {recording ? (
                  <button onClick={stopRec} className="flex flex-col items-center gap-1 rounded-xl bg-[#c2412b] py-3 text-xs font-semibold text-white">
                    <Square size={20} className="animate-pulse" /> Stop
                  </button>
                ) : (
                  <button onClick={startRec} className="flex flex-col items-center gap-1 rounded-xl bg-[#f5f3ed] py-3 text-xs font-semibold hover:bg-[#ecebe3]">
                    <Mic size={20} className="text-[#287354]" /> Record audio
                  </button>
                )}
              </div>
              <p className={muted}>
                Each file is dated with when it was recorded or last modified, and when you saved it. Max {fmtSize(MAX_FILE)} each.
              </p>
            </section>

            {error && <p role="alert" className="rounded-xl bg-[#fbe4df] p-3 text-sm text-[#a33b26]">{error}</p>}

            <section className="grid grid-cols-2 gap-2">
              <button onClick={verify} className={soft}><ShieldCheck size={16} /> Verify entries</button>
              <button onClick={pdf} className={soft}><FileDown size={16} /> Export PDF</button>
            </section>
            {check && (
              <div role="status" className={`rounded-xl p-3 text-sm ${check.ok ? 'bg-[#d8e8db] text-[#1f5d44]' : 'bg-[#fbe4df] text-[#a33b26]'}`}>
                {check.ok ? `All ${check.count} entries are unchanged since they were saved.` : `Problem found: ${check.problem}`}
                {check.notices.map((n) => <p key={n} className="mt-1 text-xs">{n}</p>)}
              </div>
            )}

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-base font-bold">Your entries</h2>
              <span className="text-xs text-[#89928f]">Newest first</span>
            </div>
            <ul className="space-y-2">
              {items.length === 0 && (
                <li className="rounded-2xl border border-dashed border-[#cdd2ce] p-6 text-center text-sm text-[#89928f]">
                  No entries yet. Anything you save will appear here.
                </li>
              )}
              {items.map((it, i) => <EntryCard key={it.id} item={it} seq={items.length - i} />)}
            </ul>

            <p className={`${muted} rounded-xl bg-[#ecebe3] p-3`}>
              Entries can&apos;t be edited or deleted here. Times come from this phone&apos;s clock and aren&apos;t
              independently verified. The check shows whether entries changed after saving, not that events happened.
              Clearing this browser&apos;s site data would remove everything, so keep a backup elsewhere.
            </p>
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
