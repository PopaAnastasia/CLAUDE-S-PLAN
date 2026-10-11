import type { ReactNode } from 'react'
import { CircleCheck, Lock } from 'lucide-react'

export function Modal({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#193c36]/50 p-4 backdrop-blur-sm sm:items-center">
      <div role="dialog" aria-modal="true" aria-label={label}
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-[#193c36] shadow-2xl">
        {children}
      </div>
    </div>
  )
}

const btn = 'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold'

export function SubmitWarning({
  count, busy, onCancel, onConfirm,
}: { count: number; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal label="Before you save">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Lock size={20} className="text-[#287354]" /> Before you save</h2>
      <p className="mt-2 text-sm text-[#687773]">
        Once you submit, {count > 1 ? 'these entries' : 'this entry'} can&apos;t be changed or
        deleted, by you or by anyone else. If something needs correcting, add a new entry.
      </p>
      <div className="mt-5 flex gap-2">
        <button disabled={busy} onClick={onCancel}
          className={`${btn} border border-[#e5e6df] text-[#193c36]`}>Go back</button>
        <button disabled={busy} onClick={onConfirm}
          className={`${btn} bg-[#287354] text-white hover:bg-[#1f5d44] disabled:opacity-50`}>
          {busy ? 'Saving…' : 'OK, save'}
        </button>
      </div>
    </Modal>
  )
}

export function SavedNotice({
  onBackup, onDone,
}: { onBackup: () => void; onDone: () => void }) {
  return (
    <Modal label="Log saved">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[#287354]"><CircleCheck size={22} /> Log saved</h2>
      <p className="mt-2 text-sm text-[#687773]">
        This log lives only on this phone. If the phone is lost or damaged, it can&apos;t be
        recovered. Please share a copy with someone you trust, such as a friend, family member,
        advocate or lawyer.
      </p>
      <p className="mt-2 text-xs text-[#89928f]">
        A copy is encrypted and opens only with the app link and the one-time code shown after
        backup creation.
      </p>
      <div className="mt-5 flex gap-2">
        <button onClick={onDone} className={`${btn} border border-[#e5e6df] text-[#193c36]`}>Done</button>
        <button onClick={onBackup} className={`${btn} bg-[#287354] text-white hover:bg-[#1f5d44]`}>
          Create backup now
        </button>
      </div>
    </Modal>
  )
}
