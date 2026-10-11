# Changes since the last update

This covers only what changed after the previous [CHANGES.md](CHANGES.md) was shared, the version with walk mode and the custom step amount. CHANGES.md itself is kept up to date with everything; this file is the short list of what's new since then.

## Summary

| Area | Before | Now |
|---|---|---|
| Logo and icons | Generic dumbbell icon, Vite's default browser-tab icon, plain "Shake" text | **Shake logo** everywhere: home-screen icon, tab icon, Dashboard header, launch intro |
| Opening the app | Straight to the Dashboard | Short **logo intro** on launch (tap to skip), never after a quick exit |
| Installing | Only a website in Safari | **Installs like an app**: home-screen icon, full screen, install guide in Settings |
| Steps | Started at a fake 6,420 and never reset | Start at **0**; steps, meals, calories and workouts **reset every day** |
| Shake on iPhone | Did nothing unless the right tap had happened first; needed 4 very hard jolts | Works as soon as the journal opens; about **3 firm shakes** |
| Motion permission | Asked inside private screens | Asked once, like a fitness app (welcome tour), then renewed silently; **Help search never asks** |
| Shake on the setup screen | Not available | **Shake or Esc** leaves setup, nothing saved |
| iPhone "Undo Typing" popup | Could appear while the journal stayed open | Journal closes underneath; popup made less likely |

## 1. Logo and branding

- **App icons** (home screen, install, Apple touch) are now the Shake **lime lightning bolt on violet**, traced from the logo video so they stay sharp at every size. The browser-tab icon is a small version of the same bolt. Replaced the generic dumbbell icon and Vite's default `favicon.svg`.
- **Dashboard header** shows the full Shake logo instead of plain text. It works with any app color chosen in Profile.
- **Launch intro** (`src/components/Splash.tsx`):
  - The logo animation plays once when the app is opened. It's sped up slightly (about 3 seconds instead of 4.4), and a tap anywhere skips it.
  - It **never** plays after a shake or other quick exit, so leaving the journal always lands straight on the Dashboard.
  - It's skipped on the shared-record page (`/#/receive`) and for people with reduced motion turned on.
  - The original `.mov` (a format Chrome and many Android phones can't play) was converted to two small web videos, `public/intro.webm` and `public/intro.mp4` (about 50 KB each). Each browser plays whichever it supports, and both are cached for offline use.
- **Colors:** the default app violet now matches the logo exactly (`#523ACB`), the Dashboard progress bar uses the logo's lime (`#B8FC65`), and the install splash and browser theme color are violet too.

## 2. Installs like an app

- New **"Add Shake to your Home Screen"** card in the fitness **Settings** page:
  - **iPhone:** step-by-step Safari instructions (Share → Add to Home Screen → Add).
  - **Android:** a one-tap **Install Shake** button where Chrome supports it, otherwise the menu steps.
  - The card hides itself once Shake is installed.
- iPhone home-screen tags added to `index.html`, so Shake opens **full screen** from its own icon and name, without Safari's address bar.

## 3. Steps, meals and workouts are per day

- A fresh install starts at **0 steps**. Before, it started at a made-up 6,420.
- **Steps, today's meals, calories eaten, calories burned and the workouts count all start fresh each day**, at midnight or when the app is opened the next day. Before, nothing ever reset.
- Today's meal photo is per day too.
- Workout history keeps the last 30 days, so storage doesn't grow forever.
- The Fonts preview uses a neutral sample number (4,250) so it isn't mistaken for real data.

## 4. Shake to exit: works reliably on iPhone

**Easier to trigger, still hard to trigger by accident**
- It now takes about **three firm shakes**. Before, it needed four very hard jolts.
- In simulated tests it ignores a still phone, walking, running, a single drop and a gentle wiggle.
- It also works on phones that only report gravity-free motion.

**Motion permission is app-wide and asked like a fitness app would**
- iPhone only lets a web app read motion after a tap that asks for it. Before, if someone reopened the app and went straight to the journal without that tap, shake did nothing. That was the bug found on the phone.
- **First launch:** the welcome tour now says "Shake uses your phone's motion sensor to count steps when you track a walk. If your phone asks, tap Allow." The **Get started** button shows iPhone's one-time prompt.
- **Every later launch:** the app quietly renews the permission on the first tap anywhere (menu, a tab, skipping the intro). iPhone answers without a popup once motion has been allowed.
- **Nothing private ever triggers the prompt.** Help search never asks. If someone skipped it in the tour, tapping **Start walk** asks.
- Walk mode and shake share the one permission.
- If the person taps Allow a moment after the journal opens, shake still switches on.

**Shake also works on the private setup screen**
- Shaking (or pressing **Esc**) on the setup screen leaves at once, back to the Dashboard. Nothing typed is saved, and the form is empty the next time.

**iPhone "Shake to Undo"**
- Safari keeps iPhone's own shake gesture on, and it can pop up "Undo Typing". A web app can't switch it off (only native apps can). Nobody has to change their iPhone settings.
- Shake now closes the journal underneath that popup, so if it appears, it sits on top of the fitness Dashboard, where it looks like a normal iPhone popup.
- To make it less likely, the Help search box, the journal's note fields and the Change phrases fields are replaced with fresh ones after each use, so there's usually no recent typing to undo.
- A native wrapper (see the README roadmap) would remove the popup completely.

## 5. Documentation

- **README.md** updated for all of the above: branding and intro, installing on iPhone and Android, per-day fitness data, shake and motion permission, a new "iPhone Shake to Undo" limitation, an updated flowchart (shake also leaves setup), testing and judge steps, project structure (`Splash.tsx`, logo, intro videos), and the roadmap (a native wrapper also removes the Undo popup).
- **CHANGES.md** updated with the same changes.
- **CHANGES-2.md** (this file) added.

## How it was checked

- In the browser, at phone size and in the laptop phone frame, with no console errors.
- **Simulated iPhone permission rules** (remembers Allow across launches, only grants during a tap, shows a popup only while undecided):
  - Exactly **one** popup ever, at Get started on first launch.
  - On later launches, opening the journal straight from Help with no taps inside it, a shake closed it. The test failed the same way the phone did before the fix, and passed after.
  - Walk mode works on later launches without a popup.
- Shake on the setup screen and Esc both return to the Dashboard with nothing saved.
- Daily reset: fresh install shows 0; same-day reload keeps the numbers; next day is back to 0.
- Intro: plays on launch, skipped on reload in the same session, tap skips it, not shown on `/#/receive`; the manifest has the new name, colors and icons.
- Earlier checks still pass: setup code, phrases, decoy, Change phrases, help search, walk mode, custom steps.
- **Tested on a real iPhone:** shake from the journal back to the Dashboard. Shake on the setup screen was added after that test.

## Files

| Status | File |
|---|---|
| Added | `src/components/Splash.tsx`, `src/assets/logo.png`, `public/intro.webm`, `public/intro.mp4`, `public/favicon.png`, `CHANGES-2.md` |
| Removed | `public/favicon.svg` (Vite's default logo) |
| Changed | `src/App.tsx`, `src/components/FitnessApp.tsx`, `Trackers.tsx`, `Phrases.tsx`, `VaultHome.tsx`, `WelcomeTour.tsx`, `ProfilePage.tsx`, `Backup.tsx`, `Bar.tsx`, `data.ts`, `src/lib/useShake.ts`, `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `index.html`, `vite.config.ts`, `README.md`, `CHANGES.md` |
| Unchanged | Encryption, storage, hash chain, backup format, PDF export, walk mode's step counting. Existing journals and backups still work. |
