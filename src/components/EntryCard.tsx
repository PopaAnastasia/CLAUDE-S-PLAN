import { useEffect, useState } from 'react'
import { Mic, Video, Image as ImageIcon, StickyNote, MessageSquareText } from 'lucide-react'
import { getFile, type Item } from '../storage/evidence'
import { fmtSize, fmtTime } from '../lib/format'

const ICON = { note: StickyNote, chat: MessageSquareText, photo: ImageIcon, audio: Mic, video: Video }

// Shows one saved entry. The only actions are viewing and downloading a copy.
type Loader = () => Promise<{ blob: Blob; name: string } | null>

export default function EntryCard({
  item, seq, loader,
}: { item: Item; seq?: number; loader?: Loader }) {
  const [url, setUrl] = useState<string | null>(null)
  const Icon = ICON[item.kind]

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  const load = async () => {
    const f = await (loader ?? (() => getFile(item.id)))()
    if (f) setUrl(URL.createObjectURL(f.blob))
  }
  const save = async () => {
    const f = await (loader ?? (() => getFile(item.id)))()
    if (!f) return
    const u = URL.createObjectURL(f.blob)
    const a = document.createElement('a')
    a.href = u
    a.download = f.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(u), 10_000)
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold">
        <Icon size={16} className="text-indigo-600" />
        {seq ? <span className="text-slate-400">#{seq}</span> : null}
        <span className="truncate">{item.title}</span>
      </div>
      <dl className="mt-1 space-y-0.5 text-xs text-slate-500">
        <div><dt className="inline font-medium">Saved: </dt><dd className="inline">{fmtTime(item.createdAt, item.tz)}</dd></div>
        {item.happenedAt && <div><dt className="inline font-medium">Happened (as entered): </dt><dd className="inline">{fmtTime(item.happenedAt, item.tz)}</dd></div>}
        {item.capturedAt && <div><dt className="inline font-medium">{item.capturedFrom === 'recording' ? 'Recorded: ' : 'File dated: '}</dt><dd className="inline">{fmtTime(item.capturedAt, item.tz)}</dd></div>}
      </dl>
      {item.text && <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">{item.text}</p>}
      {item.fileName && (
        <div className="mt-2">
          <p className="text-xs text-slate-500">{item.fileName}{item.size ? ` · ${fmtSize(item.size)}` : ''}</p>
          {url ? (
            item.kind === 'photo' ? <img src={url} alt={item.title} className="mt-1 max-h-64 rounded-lg" />
            : item.kind === 'video' ? <video src={url} controls className="mt-1 max-h-64 w-full rounded-lg" />
            : <audio src={url} controls className="mt-1 w-full" />
          ) : (
            <button onClick={load} className="mt-1 text-xs font-medium text-indigo-700 underline">Show / play</button>
          )}
          <button onClick={save} className="ml-3 text-xs font-medium text-indigo-700 underline">Download copy</button>
        </div>
      )}
    </li>
  )
}
