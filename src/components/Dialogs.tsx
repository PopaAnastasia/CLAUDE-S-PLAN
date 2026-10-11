import type { ReactNode } from 'react'

export function Modal({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-label={label}
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-800 shadow-xl">
        {children}
      </div>
    </div>
  )
}

const btn = 'rounded-lg px-4 py-2 text-sm font-medium'

export function SubmitWarning({
  count, busy, onCancel, onConfirm,
}: { count: number; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal label="Before you save">
      <h2 className="text-lg font-bold">Before you save</h2>
      <p className="mt-2 text-sm text-slate-600">
        Once you submit, {count > 1 ? 'these entries' : 'this entry'} can&apos;t be changed or
        deleted, by you or by anyone else. If something needs correcting, add a new entry.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button disabled={busy} onClick={onCancel}
          className={`${btn} border border-slate-300 text-slate-700`}>Go back</button>
        <button disabled={busy} onClick={onConfirm}
          className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50`}>
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
      <h2 className="text-lg font-bold text-emerald-700">Log saved</h2>
      <p className="mt-2 text-sm text-slate-600">
        This log lives only on this phone. If the phone is lost or damaged, it can&apos;t be
        recovered. Please share a copy with someone you trust, such as a friend, family member,
        advocate or lawyer.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        A copy is encrypted and opens only with the app link and the one-time code shown after
        backup creation.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onDone} className={`${btn} border border-slate-300 text-slate-700`}>Done</button>
        <button onClick={onBackup} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
          Create backup now
        </button>
      </div>
    </Modal>
  )
}
