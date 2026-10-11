import { useEffect, useState } from 'react'
import {
  Check, ChevronRight, CircleHelp, Clock, Copy, Mail, Menu, MessageCircle, SearchX,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { isVaultConfigured, lockVault, unlockVault, type VaultMode } from '../crypto/vault'
import { isSetupCode } from '../lib/access'
import logo from '../assets/logo.png'
import { Dashboard, Workouts } from './Dashboard'
import ProfilePage from './ProfilePage'
import { Calories, FontsPage, SettingsPage, Steps } from './Trackers'
import {
  NAV, SIZES, TABS, TITLES, card, field, primary, useStored,
  dayKey, useDaily,
  type Food, type Log, type Page, type Size, type Workout,
} from './data'

export default function FitnessApp({
  onResult,
  onSetup,
}: {
  onResult: (mode: VaultMode | null) => void
  onSetup: () => void
}) {
  const [page, setPage] = useState<Page>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  // Steps, meals and workouts are per day: everything starts at 0 each morning.
  const [today, setToday] = useState(dayKey)
  const [steps, setSteps] = useDaily<number>('fit.dailySteps', 0, today)
  const [goal, setGoal] = useStored<number>('fit.goal', 10000)
  const [allFoods, setFoods] = useStored<Food[]>('fit.foods', [])
  const [mealImage, setMealImage] = useDaily<string | null>('fit.dailyMealImage', null, today)
  const [logs, setLogs] = useStored<Log[]>('fit.logs', [])
  // Meals are only kept for today (their id is the time they were added).
  const foods = allFoods.filter((f) => dayKey(f.id) === today)
  const todayLogs = logs.filter((l) => dayKey(l.at) === today)
  const [size, setSize] = useStored<Size>('fit.size', 'normal')
  const [accentColor, setAccentColor] = useStored<string>('fit.accentColor', '#523acb')
  const [profileName] = useStored<string>('fit.name', '')
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  // Result of the last help search: null = no search yet, [] = nothing matched.
  const [results, setResults] = useState<Article[] | null>(null)
  // Bumped after every search so the box is replaced with a fresh one. That way
  // iPhone has no earlier typing to offer "Undo Typing" for when the phone is shaken.
  const [boxId, setBoxId] = useState(0)

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[size]
  }, [size])

  // Roll over to a new day at midnight, or when the app is reopened the next day.
  useEffect(() => {
    const check = () => setToday(dayKey())
    const t = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  const totalKcal = foods.reduce((s, f) => s + f.kcal, 0)
  const burned = todayLogs.reduce((s, l) => s + l.kcal, 0)

  const go = (p: Page) => {
    setPage(p)
    setMenuOpen(false)
    setResults(null)
  }

  const logWorkout = (w: Workout) =>
    setLogs([
      { id: Date.now(), name: w.name, mins: w.mins, kcal: w.kcal, at: new Date().toISOString() },
      ...logs.filter((l) => Date.now() - new Date(l.at).getTime() < 30 * 864e5),
    ])

  // Every question is checked against the vault. Only the real phrase opens the
  // journal. Anything else (including the decoy phrase) behaves like a normal
  // help search, so a wrong guess never looks different from a real question.
  const ask = async () => {
    if (busy || !question.trim()) return
    setBusy(true)
    const q = question
    const started = Date.now()
    // The setup code only works before a journal exists on this phone.
    const setup = !isVaultConfigured() && isSetupCode(q)
    let mode: VaultMode | null = null
    if (!setup) {
      try {
        mode = await unlockVault(q)
      } catch {
        mode = null
      }
    }
    // Every search takes a moment, like a real search, so a phone without a
    // journal doesn't answer noticeably faster than one with a journal.
    const wait = 900 - (Date.now() - started)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    setQuestion('')
    setBoxId((n) => n + 1)
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setBusy(false)
    if (setup) {
      setResults(null)
      onSetup()
      return
    }
    if (mode === 'real') {
      setResults(null)
      onResult(mode)
      return
    }
    if (mode) lockVault()
    setResults(searchArticles(q))
  }
  return (
    <div
      className="relative mx-auto flex min-h-screen max-w-md flex-col bg-[#f5f3ed] text-[#193c36]"
      style={{ '--fit-accent': accentColor } as CSSProperties}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[var(--fit-accent)] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu size={22} />
          </button>
          {page === 'dashboard' ? (
            <h1><img src={logo} alt="Shake" className="h-6 w-auto" /></h1>
          ) : (
            <h1 className="text-lg font-bold tracking-wide">{TITLES[page]}</h1>
          )}
        </div>
        <button
          onClick={() => go('profile')}
          aria-label="Open profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold"
        >
          {(profileName.trim()[0] || 'U').toUpperCase()}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-y-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2">
          <aside className="flex w-72 flex-col justify-between bg-[#fbfbf7] shadow-2xl">
            <div>
              <div className="bg-[var(--fit-accent)] p-6 text-white">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
                  {(profileName.trim()[0] || 'U').toUpperCase()}
                </div>
                <h2 className="text-lg font-bold">My Profile</h2>
                <p className="text-xs text-[#ded9eb]">Goal: Stay active</p>
              </div>
              <nav className="space-y-1 p-4">
                {NAV.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#193c36] hover:bg-[#f5f3ed]"
                  >
                    <Icon size={20} className="text-[#e66c52]" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex gap-4 border-t border-[#e5e6df] p-4">
              <button className="text-xs text-[#89928f]" onClick={() => go('help')}>Help</button>
              <button className="text-xs text-[#89928f]" onClick={() => go('contact')}>Contact us</button>
            </div>
          </aside>
          <button
            className="flex-1 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 space-y-4 p-4">
        {page === 'dashboard' && (
          <Dashboard
            name={profileName}
            steps={steps}
            goal={goal}
            burned={burned}
            totalKcal={totalKcal}
            logs={todayLogs}
            go={go}
          />
        )}
        {page === 'workouts' && <Workouts onLog={logWorkout} />}
        {page === 'calories' && (
          <Calories
            foods={foods}
            setFoods={setFoods}
            totalKcal={totalKcal}
            mealImage={mealImage}
            setMealImage={setMealImage}
          />
        )}
        {page === 'steps' && <Steps steps={steps} setSteps={setSteps} goal={goal} />}
        {page === 'settings' && <SettingsPage goal={goal} setGoal={setGoal} go={go} />}
        {page === 'fonts' && <FontsPage size={size} setSize={setSize} />}
        {page === 'profile' && (
          <ProfilePage accentColor={accentColor} setAccentColor={setAccentColor} />
        )}

        {page === 'help' && (
          <>
            <p className="rounded-2xl bg-[#d8e8db] p-4 text-sm text-[#287354]">
              Find answers about syncing, tracking and settings, or ask us a question.
            </p>
            <div className="space-y-2">
              {POPULAR.map((a) => (
                <ArticleItem key={a.q} article={a} />
              ))}
            </div>
            <div className="space-y-2 rounded-2xl bg-[#ded9eb] p-4">
              <p className="text-sm font-bold text-[#193c36]">Ask a question</p>
              <p className="text-xs text-[#687773]">
                Can&apos;t find your answer? Search our help articles.
              </p>
              <div className="flex gap-2">
                <input
                  key={boxId}
                  className={field}
                  placeholder="Type your question"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value)
                    if (results) setResults(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void ask()
                  }}
                />
                <button
                  disabled={busy}
                  onClick={() => void ask()}
                  className={`${primary} disabled:opacity-60`}
                >
                  {busy ? 'Searching…' : 'Search'}
                </button>
              </div>
            </div>

            {results && results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#193c36]">Articles that might help</p>
                {results.map((a) => (
                  <ArticleItem key={a.q} article={a} open={results.length === 1} />
                ))}
                <p className="pt-1 text-xs text-[#687773]">
                  Still stuck?{' '}
                  <button className="font-semibold text-[var(--fit-accent)]" onClick={() => go('contact')}>
                    Contact support
                  </button>
                </p>
              </div>
            )}

            {results && results.length === 0 && (
              <div className={`${card} space-y-3`}>
                <div className="flex items-start gap-3">
                  <SearchX size={20} className="mt-0.5 shrink-0 text-[#e66c52]" />
                  <div>
                    <p className="text-sm font-bold text-[#193c36]">No matching articles</p>
                    <p className="mt-1 text-xs text-[#687773]">
                      We couldn&apos;t find an answer to your question. Try rewording it, check
                      the popular questions below, or send it to our support team.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#89928f]">
                    Popular questions
                  </p>
                  {SUGGESTED.map((a) => (
                    <ArticleItem key={a.q} article={a} />
                  ))}
                </div>
                <button onClick={() => go('contact')} className={`${primary} w-full`}>
                  Contact support
                </button>
              </div>
            )}
          </>
        )}

        {page === 'contact' && <ContactPage go={go} />}
      </main>

      <footer className="sticky bottom-0 flex justify-around border-t border-[#e5e6df] bg-[#fbfbf7] py-2 text-xs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            className={`flex flex-col items-center gap-0.5 ${page === id ? 'text-[var(--fit-accent)]' : 'text-[#89928f]'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </footer>
    </div>
  )
}
type Article = { q: string; a: string }

const ARTICLES: Article[] = [
  { q: 'How do I change my step goal?', a: 'Open Settings from the menu and choose a daily step goal.' },
  { q: 'How do I log a meal?', a: 'Open Calorie Tracker, enter the food and its calories, then tap Log meal.' },
  { q: 'Do I need an account?', a: 'No. Shake works without an account, and your logs stay on this device.' },
  { q: 'How do I log a workout?', a: 'Open Workouts and tap Log workout on any session.' },
  { q: 'Why is my step count not updating?', a: 'Steps are entered on the Step Counter page. Add your steps there and the Dashboard updates right away.' },
  { q: 'How do I change the text size?', a: 'Open Fonts from the menu and pick Small, Normal or Large.' },
  { q: 'How do I change my profile color?', a: 'Tap your initial in the top corner to open My Profile, then choose an accent color.' },
  { q: 'How do I clear my data?', a: 'Use Remove next to each meal, or Reset on the Step Counter page.' },
  { q: 'Can I use Shake offline?', a: 'Yes. Once Shake is added to your home screen, it works without an internet connection.' },
]
const POPULAR = ARTICLES.slice(0, 3)
const SUGGESTED = [ARTICLES[3], ARTICLES[4], ARTICLES[8]]

const STOP = new Set(['how', 'do', 'does', 'can', 'the', 'my', 'is', 'a', 'an', 'to', 'i', 'it', 'what', 'why', 'not', 'on', 'in', 'of', 'and', 'or', 'with', 'use', 'shake', 'app'])

// Simple keyword match so the search behaves like a real help search.
function searchArticles(query: string): Article[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
  if (!words.length) return []
  const stem = (w: string) => w.replace(/(ing|es|s)$/, '')
  return ARTICLES.map((art) => {
    const text = (art.q + ' ' + art.a).toLowerCase()
    const title = art.q.toLowerCase()
    const score = words.reduce(
      (n, w) => n + (title.includes(stem(w)) ? 2 : text.includes(stem(w)) ? 1 : 0),
      0,
    )
    return { art, score }
  })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((r) => r.art)
}

function ArticleItem({ article, open = false }: { article: Article; open?: boolean }) {
  return (
    <details open={open} className={card}>
      <summary className="cursor-pointer text-sm font-semibold text-[#193c36]">{article.q}</summary>
      <p className="mt-2 text-xs text-[#687773]">{article.a}</p>
    </details>
  )
}

const SUPPORT_EMAIL = 'support@shakefit.example'

function ContactPage({ go }: { go: (p: Page) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <>
      <div className="rounded-2xl bg-[#f9ddd4] p-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/70">
          <MessageCircle size={22} className="text-[#d65d46]" />
        </div>
        <h2 className="text-xl font-bold text-[#193c36]">We&apos;re here to help</h2>
        <p className="mt-1 text-sm text-[#687773]">
          Questions, feedback or a bug to report? Our small team reads every message.
        </p>
      </div>

      <div className={`${card} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5f3ed]">
            <Mail size={18} className="text-[#e66c52]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#89928f]">Email</p>
            <p className="truncate text-sm font-semibold text-[#193c36]">{SUPPORT_EMAIL}</p>
          </div>
          <button onClick={() => void copy()} className="flex items-center gap-1 rounded-lg bg-[#f5f3ed] px-3 py-1.5 text-xs font-semibold text-[#193c36]">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex items-center gap-3 border-t border-[#e5e6df] pt-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5f3ed]">
            <Clock size={18} className="text-[#e66c52]" />
          </span>
          <div>
            <p className="text-xs text-[#89928f]">Response time</p>
            <p className="text-sm font-semibold text-[#193c36]">Usually within 2 business days</p>
          </div>
        </div>
      </div>

      <button onClick={() => go('help')} className={`${card} flex w-full items-center gap-3 text-left`}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ded9eb]">
          <CircleHelp size={18} className="text-[var(--fit-accent)]" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-[#193c36]">Looking for a quick answer?</span>
          <span className="block text-xs text-[#89928f]">Browse Help &amp; Support</span>
        </span>
        <ChevronRight size={18} className="text-[#cdd2ce]" />
      </button>
    </>
  )
}
