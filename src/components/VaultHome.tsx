import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Camera, FileText, Image as ImageIcon, MessageSquare, Mic, Music,
  Paperclip, Square, Video, type LucideIcon,
} from 'lucide-react'
import {
  addItem, demoTamper, getFile, listItems, verifyChain, wipeEvidence,
  type Item, type Kind, type Verify,
} from '../storage/evidence'
import { wipeVaultKeys } from '../crypto/vault'
import { downloadPdf, fmtSize } from '../lib/exportPdf'
import { graceLock } from '../lib/lockGrace'

const ICON: Record<Kind, LucideIcon> = {
  note: FileText, chat: MessageSquare, photo: ImageIcon, audio: Music, video: Video,
}

const kindOf = (f: File): Kind =>
  f.type.startsWith('image/') ? 'photo'
  : f.type.startsWith('video/') ? 'video'
  : f.type.startsWith('audio/') ? 'audio'
  : 'note'

type Preview = { url: string; mime: string }

export default function VaultHome({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const [chatText, setChatText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Verify | null>(null)
  const [previews, setPreviews] = useState<Record<string, Preview>>({})
  const [recording, setRecording] = useState(false)
  const [confirmWipe, setConfirmWipe] = useState(false)

  const photoRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const previewsRef = useRef<Record<string, Preview>>({})

  const refresh = useCallback(async () => {
    try {
      setItems(await listItems())
    } catch {
      setError('Could not read entries.')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { previewsRef.current = previews }, [previews])

  // Escape = quick exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // On leaving: free decrypted previews and drop any unsaved recording
  useEffect(() => () => {
    Object.values(previewsRef.current).forEach((p) => URL.revokeObjectURL(p.url))
    const rec = recRef.current
    if (rec) {
      rec.onstop = null
      rec.stream.getTracks().forEach((t) => t.stop())
      if (rec.state !== 'inactive') rec.stop()
    }
  }, [])

  const run = async (fn: () => Promise<void>, fallback = 'Something went wrong. Please try again.') => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error && e.message === 'too large' ? 'That file is too large (50 MB max).' : fallback)
    }
    setBusy(false)
  }

  const saveNote = () => {
    const body = text.trim()
    if (!body) return
    void run(async () => {
      await addItem({ kind: 'note', title: title.trim() || body.slice(0, 40), text: body })
      setTitle('')
      setText('')
      setResult(null)
      await refresh()
    })
  }

  const saveChat = () => {
    const t = chatTitle.trim()
    const body = chatText.trim()
    if (!t || !body) {
      setError('Add a title and paste the messages.')
      return
    }
    void run(async () => {
      await addItem({ kind: 'chat', title: t, text: body })
      setChatTitle('')
      setChatText('')
      setShowChat(false)
      setResult(null)
      await refresh()
    })
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    void run(async () => {
      for (const f of files) await addItem({ kind: kindOf(f), title: f.name, file: f })
      setResult(null)
      await refresh()
    })
  }

  const openPicker = (ref: { current: HTMLInputElement | null }) => {
    graceLock() // keep the vault open while the camera or file picker is up
    ref.current?.click()
  }

  const startRec = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const type = rec.mimeType || 'audio/webm'
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        const file = new File(chunksRef.current, `recording.${ext}`, { type })
        void run(async () => {
          await addItem({ kind: 'audio', title: 'Audio recording', file })
          setResult(null)
          await refresh()
        })
      }
      rec.start()
      recRef.current = rec
      setRecording(true)
    } catch {
      setError('Microphone not available. Check your browser permissions.')
    }
  }

  const stopRec = () => {
    recRef.current?.stop()
    recRef.current = null
    setRecording(false)
  }

  const togglePreview = async (it: Item) => {
    const existing = previews[it.id]
    if (existing) {
      URL.revokeObjectURL(existing.url)
      setPreviews((p) => {
        const n = { ...p }
        delete n[it.id]
        return n
      })
      return
    }
    const f = await getFile(it.id)
    if (!f) return
    setPreviews((p) => ({ ...p, [it.id]: { url: URL.createObjectURL(f.blob), mime: f.blob.type } }))
  }

  const verify = () => void run(async () => setResult(await verifyChain()), 'Could not check entries.')
  const exportPdf = () => void run(() => downloadPdf(), 'Could not create the PDF.')
  const tamper = () => void run(async () => { await demoTamper(); setResult(null) })
  const wipe = () =>
    void run(async () => {
      await wipeEvidence()
      wipeVaultKeys()
      window.location.reload()
    })

  const card = 'rounded-xl border border-slate-100 bg-white p-4 shadow-sm'
  const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
  const btn = 'flex items-center justify-center gap-2 rounded-lg bg-indigo-50 px-3 py-3 text-sm font-medium text-indigo-700 disabled:opacity-50'

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 px-4 py-3 text-white shadow-md">
        <h1 className="text-lg font-bold tracking-wide">Journal</h1>
        <button onClick={onClose} className="rounded-lg bg-indigo-500 px-3 py-1 text-sm">Close</button>
      </header>

      <main className="flex-1 space-y-4 p-4">
        <div className={`${card} space-y-2`}>
          <input className={field} placeholder="Title (optional)" value={title}
            onChange={(e) => setTitle(e.target.value)} />
          <textarea rows={4} className={field}
            placeholder="What happened? Date, place, who was there, what was said."
            value={text} onChange={(e) => setText(e.target.value)} />
          <button disabled={busy} onClick={saveNote}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? 'Working…' : 'Save entry'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-slate-400">Saved privately on this device.</p>
        </div>

        <div className={`${card} space-y-3`}>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} className={btn} onClick={() => openPicker(photoRef)}>
              <Camera size={18} /> Photo
            </button>
            <button disabled={busy} className={btn} onClick={() => openPicker(fileRef)}>
              <Paperclip size={18} /> Add file
            </button>
            {recording ? (
              <button className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-medium text-white" onClick={stopRec}>
                <Square size={18} /> Stop &amp; save
              </button>
            ) : (
              <button disabled={busy} className={btn} onClick={() => void startRec()}>
                <Mic size={18} /> Record audio
              </button>
            )}
            <button disabled={busy} className={btn} onClick={() => setShowChat((s) => !s)}>
              <MessageSquare size={18} /> Messages
            </button>
          </div>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" multiple hidden onChange={onPick} />
          <p className="text-xs text-slate-400">
            Recording laws differ by state. In some states everyone in the
            conversation must agree. Record only where the law allows. A recording
            in progress is lost if you leave the app.
          </p>
        </div>

        {showChat && (
          <div className={`${card} space-y-2`}>
            <input className={field} placeholder="Title (e.g. Text thread, Oct 10)" value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)} />
            <textarea rows={5} className={field} placeholder="Paste the messages here…"
              value={chatText} onChange={(e) => setChatText(e.target.value)} />
            <button disabled={busy} onClick={saveChat}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white disabled:opacity-50">
              Save messages
            </button>
          </div>
        )}

        <div className={`${card} space-y-2`}>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={verify} className={btn}>Verify entries</button>
            <button disabled={busy} onClick={exportPdf} className={btn}>Export PDF</button>
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? 'text-emerald-700' : 'text-red-600'}`}>
              {result.ok ? `Checked ${result.count} entries. No changes detected.` : result.problem}
            </p>
          )}
          <p className="text-xs text-slate-400">
            Verify detects edited entries and entries removed from the middle. It
            cannot detect removal of the newest entries. The exported PDF is not
            encrypted, so delete it after you share it.
          </p>
        </div>

        <div className="space-y-3">
          {items.length === 0 && <p className="text-center text-sm text-slate-400">No entries yet.</p>}
          {items.map((it) => {
            const Icon = ICON[it.kind]
            const pv = previews[it.id]
            return (
              <div key={it.id} className={`${card} space-y-2`}>
                <div className="flex items-start gap-3">
                  <Icon size={20} className="mt-0.5 shrink-0 text-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{it.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(it.createdAt).toLocaleString()}
                      {it.size ? ` · ${fmtSize(it.size)}` : ''}
                    </p>
                  </div>
                  {it.fileHash && (
                    <button onClick={() => void togglePreview(it)} className="text-xs text-indigo-600">
                      {pv ? 'Hide' : 'Open'}
                    </button>
                  )}
                </div>
                {it.text && (
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{it.text}</p>
                )}
                {pv?.mime.startsWith('image/') && <img src={pv.url} alt="" className="w-full rounded-lg" />}
                {pv?.mime.startsWith('audio/') && <audio controls src={pv.url} className="w-full" />}
                {pv?.mime.startsWith('video/') && <video controls src={pv.url} className="w-full rounded-lg" />}
                {it.fileHash && (
                  <p className="break-all font-mono text-[10px] text-slate-400">SHA-256 {it.fileHash.slice(0, 16)}…</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-2 pb-6">
          <button onClick={tamper} className="block text-xs text-slate-400 underline">
            Demo: simulate tampering (tap again to undo)
          </button>
          {!confirmWipe ? (
            <button onClick={() => setConfirmWipe(true)} className="block text-xs text-slate-400 underline">
              Erase everything
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600">This permanently deletes all entries and cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={wipe} className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white">Erase now</button>
                <button onClick={() => setConfirmWipe(false)} className="flex-1 rounded-lg bg-slate-200 py-2 text-sm text-slate-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}