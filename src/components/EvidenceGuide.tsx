import { KeyRound, Link, LockKeyhole, PlaySquare, Upload, X } from 'lucide-react'
import { Modal } from './Dialogs'

export default function EvidenceGuide({ onDone }: { onDone: () => void }) {
  return (
    <Modal label="Evidence feature instructions">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#e66c52]">
            Private journal guide
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#193c36]">How evidence works</h2>
        </div>
        <button onClick={onDone} aria-label="Close instructions" className="text-[#89928f]">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
        <section className="rounded-xl bg-[#ded9eb] p-3">
          <div className="flex items-center gap-2 text-[#5d43d6]">
            <KeyRound size={18} />
            <h3 className="font-bold">1. Set your security key</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#687773]">
            Open Profile from the menu and create your security phrases. Keep them private and
            choose phrases you can remember. Use the Help page to enter your phrase when you need
            to open the protected journal.
          </p>
        </section>

        <section className="rounded-xl bg-[#f9ddd4] p-3">
          <div className="flex items-center gap-2 text-[#d65d46]">
            <PlaySquare size={18} />
            <h3 className="font-bold">2. Add photos and recordings</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#687773]">
            In the journal, add a note or message, then use Add files or Camera for photos and
            video. Use Record audio for a recording. Review the details before saving; saved
            entries cannot be edited or deleted.
          </p>
        </section>

        <section className="rounded-xl bg-[#d8e8db] p-3">
          <div className="flex items-center gap-2 text-[#287354]">
            <Upload size={18} />
            <h3 className="font-bold">3. Export a protected file</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#687773]">
            Open Backup and choose Create backup. Daily downloads one encrypted <strong>.dfb</strong>{' '}
            file containing your entries and media. The file is not readable as a normal document.
          </p>
        </section>

        <section className="rounded-xl bg-[#f6df9a] p-3">
          <div className="flex items-center gap-2 text-[#725a17]">
            <LockKeyhole size={18} />
            <h3 className="font-bold">4. Keep the code separate</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#687773]">
            A new five-word code is generated using secure random values for each backup. It is
            shown once and is not stored. Share the file and code through separate channels.
          </p>
        </section>

        <section className="rounded-xl bg-[#f5f3ed] p-3">
          <div className="flex items-center gap-2 text-[#5d43d6]">
            <Link size={18} />
            <h3 className="font-bold">5. Open it with the app link</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#687773]">
            The recipient opens the Daily app link, goes to <strong>/#/receive</strong>, selects
            the downloaded file, and enters the matching five-word code. The file cannot be opened
            with only the link or only the code.
          </p>
        </section>
      </div>

      <button onClick={onDone} className="mt-4 w-full rounded-xl bg-[#5d43d6] py-2.5 text-sm font-semibold text-white">
        Got it
      </button>
    </Modal>
  )
}
