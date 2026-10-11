# Changes in this version

What changed between the previous version of the repo (the app called **Daily Fit**, with phrases set in Profile → Passwords) and this one (**Shake**). Full details of how everything works are in the [README](README.md).

## Summary

| Area | Before | Now |
|---|---|---|
| App name | Daily Fit | **Shake** |
| Setting up the journal | Profile → Passwords section, visible to anyone | **Setup code** typed into Help, shared in person by partners, works only before a journal exists |
| Changing phrases | Profile → Passwords | **Journal → Settings → Change phrases** |
| Wrong phrase / decoy in Help | Jumped to a separate FAQ page with unrelated questions | **Normal help search results**: matching articles, or "No matching articles" with suggestions and Contact support |
| Shake to exit | Optional, off by default, checkbox at the bottom of the journal | **On by default**, returns to the fitness Dashboard, setting in Journal → Settings |
| Steps | Started at a fake 6,420 and never reset; +500 / +1,000 buttons and "Set exact total" | Start at **0** and **reset every day**; **add any number**, quick +500 / +1,000 / +2,500, and **Track a walk** (live step counting) |
| Look and feel | Fitness pages partly styled; journal and shared-record page in plain default styling | **Redesigned pages** with one consistent look; journal has its own calm style |
| On a laptop | Narrow column on an empty page | **Phone-shaped frame** |
| Logo and icons | Generic dumbbell icon, Vite's default browser-tab icon | **Shake logo** everywhere: icons, header, launch intro |

## 1. Renamed to Shake

Every place a user can see the name now says **Shake**:
- Browser tab title, home-screen install name and app description (`index.html`, `vite.config.ts`).
- Dashboard header, welcome tour ("Getting around Shake"), help articles.
- Support email `support@shakefit.example`.
- Backup files are now named `shake-backup-<date>.dfb`.

Internal storage names (`dailyfit` database, `daily.cfg.*` and `daily.tourSeen` keys) are unchanged on purpose. Users never see them, and renaming them would make phones that already have a journal lose access to it.

## 2. Nothing public hints at the journal

**Removed:** the *Passwords* section from Profile (current password, new password, confirm, recovery password). Profile now has only name, bio, focus, app color and units.

**Added: setup code** (`src/lib/access.ts`, currently `fresh start 26`).
- Typed into **Help → Ask a question** on a phone with **no journal yet**, it opens a new **Private setup** screen (`src/components/Phrases.tsx`).
- The setup screen explains how to open the journal and asks for a **private phrase** (twice) and a **decoy phrase**, then opens the journal right away.
- Once a journal exists, the setup code shows ordinary search results like any other text, so it can never reveal whether a journal is set up.
- Phrases can't be the same as the setup code.

**Moved: Change phrases** into the journal, under a new **Settings** tab. It needs the current private phrase. Entries stay readable, and the journal stays open after the change.

**Clearer wording:** "Recovery password" is now called **Decoy phrase**, with a short explanation of when to use it.

## 3. Help search behaves like a real help center

**Removed:** the separate FAQ page (`src/components/FaqPage.tsx`) that wrong phrases and the decoy phrase used to jump to. It had a different style and a "Back to app" link.

**Now**, every search that isn't the private phrase stays on the Help page and shows:
- **"Articles that might help"** when the words match a help article (best match first, the top one expanded), plus a "Still stuck? Contact support" link; or
- **"No matching articles"**: "We couldn't find an answer to your question", three popular questions, and a **Contact support** button.

Also:
- There are now **nine help articles** (step goal, log a meal, account, log a workout, step count not updating, text size, profile color, clearing data, offline use).
- The typed text is cleared after every search and **never shown back on screen**.
- Every search takes about one second, with a "Searching…" label. That way, a phone with no journal doesn't answer faster than a phone with one.
- The decoy phrase gives exactly the same results as any other text.

## 4. Shake to exit: on by default

- **On by default.** Shaking the phone in the journal locks it and goes straight back to the fitness **Dashboard**.
- **Also on the private setup screen:** shaking (or pressing Esc) leaves setup at once, back to the Dashboard. Nothing typed is saved.
- On iPhone, motion access is requested when the person taps **Save and open journal** during setup. If access is missing later (for example after the browser restarts), a **"Turn on shake to exit"** button appears at the top of the journal for a one-tap fix.
- It can be turned off in **Journal → Settings → Quick exit**. It stays off only if the person turned it off.
- **More reliable:** it now takes about **three firm shakes** (it used to need four very hard jolts). In simulated tests it still ignores a still phone, walking, running, a single drop and a gentle wiggle. It also works on phones that only report gravity-free motion.
- **Motion access is app-wide and asked like a fitness app would.** The welcome tour's **Get started** button asks once ("Shake uses your phone's motion sensor to count steps when you track a walk"). On every later launch the app quietly renews it on the first tap anywhere, which iPhone requires but answers without a popup. Walk mode and shake share it. Nothing private ever triggers the prompt: Help search never asks. If someone skipped it, Start walk asks. Before, reopening the app and going straight to the journal left shake switched off, because iPhone only turns motion on after a tap that asks for it.
- **iPhone "Shake to Undo":** Safari keeps iPhone's own shake gesture on, and it can pop up "Undo Typing". A web app can't switch it off (only native apps can). The journal still closes underneath, so the box appears over the fitness Dashboard. To make it less likely, the Help box and the journal's note fields are replaced with fresh ones after each use, so there is usually no recent typing to undo. A native wrapper would remove it completely (see the README roadmap).
- Updated in `src/lib/useShake.ts`.

## 5. Step Counter

- **Starts at 0, every day.** Steps used to start at a made-up 6,420 and never reset. Now a fresh install starts at **0**, and steps, meals, calories eaten and burned, and workouts all **start fresh each day** (at midnight, or when the app is opened the next day). Workout history keeps the last 30 days.
- **Add any number of steps:** type a number and tap **Add**. Quick buttons: +500, +1,000, +2,500.
- **Set as today's total** uses the typed number. **Reset today** sets steps to 0. A short confirmation shows what changed.
- **Track a walk** (new, `src/lib/useWalk.ts`): **Start walk** counts steps live from the phone's motion sensor with a timer. **Finish and add steps** adds them to today; **Cancel** discards them. The screen stays awake during a walk where the browser allows it. It only counts while the app is open (a web app can't count in the background or read Apple Health).
- The progress ring now fills to match the percentage.

## 6. Redesigned pages

**Fitness side**
- **Dashboard:** date and greeting with the person's first name, progress card in the chosen app color with "steps to reach your goal", three quick tiles (steps %, calories eaten, workouts), **tip of the day**, and a nicer recent-activity list with a "Log a workout" link.
- **Settings:** step goal card with explanation, shortcuts to Profile, Text size, Help and Contact, and "Shake · Version 1.0".
- **Fonts:** size buttons show "Aa" at each size, plus a live preview card.
- **Contact us:** header card, email with a **Copy** button, response time, and a link to Help.
- **Profile:** the colored cards (Your space, Your focus, App color, Units) now actually show their colors. Before, a style conflict made them white.
- The **app color** chosen in Profile now applies everywhere (Dashboard card, workout filters, buttons, step goal and font buttons). Before, some places were fixed to violet.
- Welcome tour text fixed (it mentioned a "language" setting that doesn't exist) and now mentions walk mode.

**Journal** (`VaultHome.tsx`, new shared styles in `src/components/ui.ts`)
- Deep-green header showing the entry count and "stored only on this phone", and a rounded Close button.
- Four tabs with icons: **Log, Backup, Get help, Settings** (Settings is new).
- Log: Note / Paste messages toggle, larger Add files / Camera / Record audio buttons, side-by-side Verify and Export buttons, a "Your entries" heading and a friendlier empty state.
- Entry cards with icons, entry numbers and clearer timestamps; Show / play and Download copy as buttons.
- **Get help:** a red 911 card, Call buttons, and a new **Text START** button for the National Hotline.
- **Backup:** clearer cards, with the five-word code shown in a large, easy-to-copy box.
- **Dialogs** ("Before you save", "Log saved"): rounded, with icons and full-width buttons.

**Open a shared record** (`/#/receive`): same style as the journal, labeled file and code fields, and a clear pass/fail integrity banner.

## 7. Phone frame on laptops

On screens wider than a phone, the app is shown inside a **phone-shaped frame** (`src/index.css`), with the menu and pop-ups staying inside it. On real phones nothing changes. The browser theme color now matches the app.

## 8. Installs like an app

- **Add Shake to your Home Screen** card in the fitness **Settings** page: a one-tap **Install** button where the browser supports it (Android Chrome), and step-by-step Safari instructions on iPhone. It hides itself once Shake is installed.
- iPhone home-screen tags added to `index.html`, so Shake opens full screen with its own name and icon, without Safari's address bar.

## 9. Logo and branding

- **App icons** (home screen, install, Apple touch) now use the Shake **lime lightning bolt on violet**, traced from the logo so they stay sharp at every size. The browser-tab icon is a small version of the same bolt. Before, the icon was a generic dumbbell and the tab icon was Vite's default logo.
- **Dashboard header** shows the Shake logo instead of plain text. It works with any app color picked in Profile.
- **Launch intro** (`src/components/Splash.tsx`): the logo animation plays once when the app is opened (about 3 seconds, tap anywhere to skip). It never plays after a shake or other quick exit, so leaving the journal always lands straight on the Dashboard. It is skipped on the shared-record page and for people with reduced motion turned on. The original `.mov` was converted to small web videos (`public/intro.webm` and `public/intro.mp4`, about 50 KB each) that play on iPhone, Android and desktop, and are cached for offline use.
- **Colors:** the default app violet now matches the logo exactly (`#523ACB`), and the Dashboard progress bar uses the logo's lime (`#B8FC65`). The install splash and browser theme color are violet too.

## 10. Documentation

- **README.md** rewritten for Shake. It covers every page and feature, the setup code, a new "How the phrases work (it is not two accounts)" section, updated flowchart, privacy notes for the motion sensor, new limitations (setup code, walk mode), updated testing, judge steps, project structure and roadmap (native wrapper for Apple Health / Health Connect). The mention of `docs/SPEC.md`, which isn't in the repo, was removed.
- **CLAUDE.md** updated: app name Shake, fitness-app disguise, how the phrases and setup code work, and the rule that public screens never mention the journal.
- **CHANGES.md** (this file) added.

## Files

| Status | File |
|---|---|
| Added | `src/components/Phrases.tsx`, `src/components/Splash.tsx`, `src/components/ui.ts`, `src/lib/access.ts`, `src/lib/useWalk.ts`, `src/assets/logo.png`, `public/intro.webm`, `public/intro.mp4`, `public/favicon.png`, `CHANGES.md` |
| Removed | `src/components/FaqPage.tsx`, `public/favicon.svg` (Vite's default logo) |
| Changed | `src/App.tsx`, `src/index.css`, `src/components/FitnessApp.tsx`, `Dashboard.tsx`, `Trackers.tsx`, `ProfilePage.tsx`, `VaultHome.tsx`, `Backup.tsx`, `Resources.tsx`, `EntryCard.tsx`, `Dialogs.tsx`, `ReceivePage.tsx`, `WelcomeTour.tsx`, `Bar.tsx`, `data.ts`, `src/lib/useShake.ts`, `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `index.html`, `vite.config.ts`, `README.md`, `CLAUDE.md` |
| Unchanged | Encryption (`crypto/vault.ts`), storage (`storage/evidence.ts`), hash chain, backup format, PDF export. Existing journals and backups still work. |
