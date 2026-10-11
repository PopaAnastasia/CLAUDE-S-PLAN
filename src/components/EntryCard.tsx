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
    <li className="rounded-2xl border border-[#e5e6df] bg-white p-4 text-sm shadow-sm">
      <div className="flex items-center gap-3 font-semibold text-[#193c36]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#d8e8db]">
          <Icon size={17} className="text-[#287354]" />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {seq ? <span className="rounded-full bg-[#f5f3ed] px-2 py-0.5 text-[11px] text-[#89928f]">#{seq}</span> : null}
      </div>
      <dl className="mt-3 space-y-0.5 border-l-2 border-[#e5e6df] pl-3 text-xs text-[#687773]">
        <div><dt className="inline font-medium">Saved: </dt><dd className="inline">{fmtTime(item.createdAt, item.tz)}</dd></div>
        {item.happenedAt && <div><dt className="inline font-medium">Happened (as entered): </dt><dd className="inline">{fmtTime(item.happenedAt, item.tz)}</dd></div>}
        {item.capturedAt && <div><dt className="inline font-medium">{item.capturedFrom === 'recording' ? 'Recorded: ' : 'File dated: '}</dt><dd className="inline">{fmtTime(item.capturedAt, item.tz)}</dd></div>}
      </dl>
      {item.text && <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-[#193c36]">{item.text}</p>}
      {item.fileName && (
        <div className="mt-2">
          <p className="text-xs text-[#89928f]">{item.fileName}{item.size ? ` · ${fmtSize(item.size)}` : ''}</p>
          {url ? (
            item.kind === 'photo' ? <img src={url} alt={item.title} className="mt-2 max-h-64 rounded-xl" />
            : item.kind === 'video' ? <video src={url} controls className="mt-2 max-h-64 w-full rounded-xl" />
            : <audio src={url} controls className="mt-2 w-full" />
          ) : (
            <button onClick={load} className="mt-2 rounded-lg bg-[#d8e8db] px-3 py-1.5 text-xs font-semibold text-[#287354]">Show / play</button>
          )}
          <button onClick={save} className="ml-2 mt-2 rounded-lg bg-[#f5f3ed] px-3 py-1.5 text-xs font-semibold text-[#193c36]">Download copy</button>
        </div>
      )}
    </li>
  )
}
