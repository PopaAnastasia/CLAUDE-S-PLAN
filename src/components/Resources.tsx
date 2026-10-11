import { Phone } from 'lucide-react'

const row = 'flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4'

export default function Resources() {
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        Calls and texts can show up in phone records or bills. If someone checks your phone, use a
        safe phone or a computer at a library or work, and clear your call history if it is safe to.
      </p>
      <div className={row}>
        <Phone className="mt-0.5 text-red-600" size={20} />
        <div>
          <p className="font-bold">Emergency: 911</p>
          <p className="text-sm text-slate-600">If you are in immediate danger.</p>
          <a className="text-sm text-indigo-700 underline" href="tel:911">Call 911</a>
        </div>
      </div>
      <div className={row}>
        <Phone className="mt-0.5 text-indigo-600" size={20} />
        <div>
          <p className="font-bold">National Domestic Violence Hotline</p>
          <p className="text-sm text-slate-600">24/7, free and confidential. Call 1-800-799-7233, or text START to 88788. Chat is on the website.</p>
          <a className="text-sm text-indigo-700 underline" href="tel:18007997233">Call 1-800-799-7233</a>
          {' · '}
          <a className="text-sm text-indigo-700 underline" href="https://www.thehotline.org" target="_blank" rel="noreferrer noopener">thehotline.org</a>
        </div>
      </div>
      <div className={row}>
        <Phone className="mt-0.5 text-indigo-600" size={20} />
        <div>
          <p className="font-bold">Georgia Statewide Domestic Violence Hotline</p>
          <p className="text-sm text-slate-600">24/7, free and confidential. 1-800-33-HAVEN (1-800-334-2836).</p>
          <a className="text-sm text-indigo-700 underline" href="tel:18003342836">Call 1-800-334-2836</a>
          {' · '}
          <a className="text-sm text-indigo-700 underline" href="https://gcadv.org" target="_blank" rel="noreferrer noopener">gcadv.org</a>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Opening a website leaves a record in this phone&apos;s browser history. Hotline advocates
        can help you plan for safety and explain your options, including how to use a record like this.
      </p>
    </div>
  )
}
