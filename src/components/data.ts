import { useState } from 'react'
import {
  Dumbbell, Flame, Footprints, House, Settings, Type, User, type LucideIcon,
} from 'lucide-react'

export type Page =
  | 'dashboard' | 'workouts' | 'calories' | 'steps'
  | 'settings' | 'fonts' | 'profile' | 'help' | 'contact'
export type Food = { id: number; name: string; kcal: number }
export type Log = { id: number; name: string; mins: number; kcal: number; at: string }

export const SIZES = { small: '14px', normal: '16px', large: '18px' } as const
export type Size = keyof typeof SIZES
export const KCAL_GOAL = 2000
export const GOALS = [5000, 8000, 10000, 12000]

export const TITLES: Record<Page, string> = {
  dashboard: 'Daily Fit',
  workouts: 'Workouts',
  calories: 'Calorie Tracker',
  steps: 'Step Counter',
  settings: 'Settings',
  fonts: 'Fonts',
  profile: 'My Profile',
  help: 'Help & Support',
  contact: 'Contact us',
}

export const NAV: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: House },
  { id: 'workouts', label: 'Workouts', Icon: Dumbbell },
  { id: 'calories', label: 'Calorie Tracker', Icon: Flame },
  { id: 'steps', label: 'Step Counter', Icon: Footprints },
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'fonts', label: 'Fonts', Icon: Type },
]

export const TABS: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Home', Icon: House },
  { id: 'workouts', label: 'Workouts', Icon: Dumbbell },
  { id: 'calories', label: 'Calories', Icon: Flame },
  { id: 'steps', label: 'Steps', Icon: Footprints },
]

export const WORKOUTS = [
  { name: 'Full Body HIIT', mins: 30, kcal: 320, note: 'High-intensity intervals to raise your heart rate.' },
  { name: 'Morning Run', mins: 30, kcal: 300, note: 'Easy pace, steady breathing.' },
  { name: 'Yoga Flow', mins: 25, kcal: 110, note: 'Gentle stretching and balance.' },
  { name: 'Strength Basics', mins: 40, kcal: 240, note: 'Bodyweight and light dumbbells.' },
]
export type Workout = (typeof WORKOUTS)[number]

export const card = 'rounded-xl border border-slate-100 bg-white p-4 shadow-sm'
export const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
export const primary = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'

// Saves ordinary fitness data only. Never store anything private here.
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const save = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }
  return [value, save] as const
}