import { MessageSquareText, Phone, TriangleAlert } from 'lucide-react'
import { muted, panel } from './ui'

const call = 'inline-flex items-center gap-1.5 rounded-xl bg-[#287354] px-3 py-2 text-sm font-semibold text-white'
const link = 'text-sm font-semibold text-[#287354] underline underline-offset-2'

export default function Resources() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-2xl bg-[#fbf0d2] p-4 text-xs leading-relaxed text-[#6b5414]">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          Calls and texts can show up in phone records or bills. If someone checks your phone, use a
          safe phone or a computer at a library or work, and clear your call history if it is safe to.
        </p>
      </div>

      <div className="rounded-2xl bg-[#c2412b] p-4 text-white shadow-sm">
        <p className="text-lg font-bold">Emergency: 911</p>
        <p className="text-sm text-white/85">If you are in immediate danger.</p>
        <a className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#c2412b]" href="tel:911">
          <Phone size={16} /> Call 911
        </a>
      </div>

      <div className={`${panel} space-y-2`}>
        <p className="font-bold">National Domestic Violence Hotline</p>
        <p className="text-sm text-[#687773]">24/7, free and confidential. Call 1-800-799-7233, or text START to 88788. Chat is on the website.</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a className={call} href="tel:18007997233"><Phone size={15} /> Call</a>
          <a className={call} href="sms:88788?&body=START"><MessageSquareText size={15} /> Text START</a>
          <a className={link} href="https://www.thehotline.org" target="_blank" rel="noreferrer noopener">thehotline.org</a>
        </div>
      </div>

      <div className={`${panel} space-y-2`}>
        <p className="font-bold">Georgia Statewide Domestic Violence Hotline</p>
        <p className="text-sm text-[#687773]">24/7, free and confidential. 1-800-33-HAVEN (1-800-334-2836).</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a className={call} href="tel:18003342836"><Phone size={15} /> Call</a>
          <a className={link} href="https://gcadv.org" target="_blank" rel="noreferrer noopener">gcadv.org</a>
        </div>
      </div>

      <p className={muted}>
        Opening a website leaves a record in this phone&apos;s browser history. Hotline advocates
        can help you plan for safety and explain your options, including how to use a record like this.
      </p>
    </div>
  )
}
