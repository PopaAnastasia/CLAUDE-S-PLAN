import { useState } from 'react'
import {
  Dumbbell, Flame, Footprints, House, Settings, Type, User, type LucideIcon,
} from 'lucide-react'

export type Page =
  | 'dashboard' | 'workouts' | 'calories' | 'steps'
  | 'settings' | 'fonts' | 'profile' | 'help' | 'contact'
export type Food = {
  id: number
  name: string
  kcal: number
  meal?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  protein?: number
  fiber?: number
}
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
  { name: 'Full Body HIIT', mins: 30, kcal: 320, type: 'Cardio', note: 'High-intensity intervals to raise your heart rate.' },
  { name: 'Morning Run', mins: 30, kcal: 300, type: 'Cardio', note: 'Easy pace, steady breathing.' },
  { name: 'Yoga Flow', mins: 25, kcal: 110, type: 'Flexibility', note: 'Gentle stretching and balance.' },
  { name: 'Strength Basics', mins: 40, kcal: 240, type: 'Strength', note: 'Bodyweight and light dumbbells.' },
] as const
export type Workout = (typeof WORKOUTS)[number]

export const card = 'rounded-2xl border border-[#e5e6df] bg-white p-4 shadow-sm'
export const field = 'w-full rounded-xl border border-[#cdd2ce] bg-white px-3 py-2 text-sm text-[#193c36] outline-none focus:border-[#5d43d6] focus:ring-2 focus:ring-[#ded9eb]'
export const primary = 'rounded-xl bg-[var(--fit-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90'

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