import { Dumbbell, Flame, Footprints, House, Menu, UserRound } from 'lucide-react'
import { Modal } from './Dialogs'
import { requestMotion } from '../lib/useShake'

const steps = [
  { Icon: House, title: 'Home', text: 'See today’s steps and calories at a glance, and your most recent activity.' },
  { Icon: Dumbbell, title: 'Workouts', text: 'Pick a workout and log it. Your minutes and calories add up on Home.' },
  { Icon: Flame, title: 'Calories', text: 'Add what you eat to track your daily calories against your goal.' },
  { Icon: Footprints, title: 'Steps', text: 'Add steps or track a walk live, and keep an eye on your daily goal.' },
  { Icon: Menu, title: 'Menu', text: 'Open the menu (top left) for settings, fonts, and Help.' },
  { Icon: UserRound, title: 'Profile', text: 'Tap your initial (top right) to set your name, focus, units, and app color.' },
]

export default function WelcomeTour({ onDone }: { onDone: () => void }) {
  return (
    <Modal label="Welcome">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#e66c52]">Welcome</p>
      <h2 className="mt-1 text-xl font-bold text-[#193c36]">Getting around Shake</h2>
      <ul className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {steps.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-xl bg-[#f5f3ed] p-3">
            <Icon size={18} className="mt-0.5 shrink-0 text-[#523acb]" />
            <div>
              <p className="text-sm font-bold text-[#193c36]">{title}</p>
              <p className="text-xs leading-relaxed text-[#687773]">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-[#89928f]">
        Shake uses your phone&apos;s motion sensor to count steps when you track a walk. If your
        phone asks, tap Allow.
      </p>
      <button
        onClick={() => {
          // A tap, so iPhone can show its one-time motion prompt here.
          void requestMotion()
          onDone()
        }}
        className="mt-3 w-full rounded-xl bg-[#523acb] py-2.5 text-sm font-semibold text-white"
      >
        Get started
      </button>
    </Modal>
  )
}
