# Daily Fit

**A private, disguised evidence log for people in unsafe situations. It looks like an ordinary fitness tracker. Everything stays on the phone.**

Hacklanta 2026 · Track: Cox Social Good (TODO: confirm track and any sponsor challenges we are actually entering)

**Live app:** TODO-paste-link-here · **Demo video:** TODO · **Devpost:** TODO

> Use fake data only when trying this. Daily Fit is a prototype. It has not been reviewed by domestic-violence advocates or lawyers, and it is not a replacement for professional help or emergency services.

## The problem

People experiencing abuse are often told to document it, but a notes app, camera roll or cloud account can be found, edited or lost. Apps that look like safety tools can be dangerous to have on a phone someone else checks.

## What it does

- **Looks like a fitness app.** Dashboard, workouts, calorie tracker and step counter all work.
- **Hidden entry.** In Help → "Ask a question", typing your private phrase opens the Journal. A decoy phrase, or any other text, opens the same ordinary FAQ page. Both phrases are set by the user in Profile.
- **Journal.** Notes, pasted chats, photos, audio and video, each with timestamps: when it was saved, when a file was recorded or last modified, and an optional "when it happened".
- **Entries can't be changed in the app.** There is no edit or delete. Before saving, the app warns that the entry is final.
- **Tamper-evident.** Every entry is linked to the one before it with a SHA-256 hash chain. "Verify entries" detects edits, removals and reordering, including of files.
- **Encrypted backup and share.** One encrypted file plus a random five-word code. It can restore the journal on a new phone, or be given to a trusted person or lawyer, who opens it at `/#/receive` with no account, no install and no upload.
- **Resources.** 911, the National DV Hotline (1-800-799-7233, text START to 88788), and the Georgia Statewide DV Hotline (1-800-334-2836), with a note about call records.
- **Safety controls.** Auto-lock after 2 minutes idle and when the app goes to the background; optional shake-to-close.
- **Export.** PDF of the record with times, hashes and the integrity result.
- **Installable.** Works offline as a PWA.

## Privacy: how it works

No backend, no accounts, no analytics, no third-party requests. The hosting service only delivers the app's code.

- Vault phrases are stretched with Argon2id (hash-wasm) and wrap a random master key.
- Two fixed-size header slots exist in random order, so a decoy and a real vault look identical on disk. Both are always tried.
- Entries and files are encrypted with AES-GCM (Web Crypto) and stored in IndexedDB. The key is non-extractable and kept only in memory while unlocked.
- Backup bundles use Argon2id from the code plus AES-GCM with the header authenticated.

## Limits (please read)

- **"Cannot be changed" means the app offers no way to edit or delete.** Someone with browser developer tools, or who clears the site's data, can still alter or wipe local storage. The hash chain would reveal a change; it can't prevent one. We say *tamper-evident*, not tamper-proof.
- **No in-app erase.** We removed it by design. A person forced to hand over their phone cannot clear the journal from inside the app, so keep an encrypted backup elsewhere.
- **Times come from the phone's clock and are not independently verified.** The check notices some clock changes. Independent timestamping would need an outside service, which we skipped to keep everything local.
- **The hash chain shows entries are unchanged since saving. It does not prove an event happened or who wrote it.** Whether a court accepts it varies by jurisdiction.
- **Not undetectable.** An installed app can appear in app lists, storage settings and device backups, and opening a hotline site leaves browser history.
- **Browser limits:** if the browser or phone clears the app's storage, the data is gone. Recording and shake permissions behave differently on iPhone and Android, and both need real-device testing.

## Try it

1. Open the live link on your phone and add it to the home screen.
2. Menu → Profile: set a private phrase and a decoy phrase (8+ characters each).
3. Menu → Help → type your private phrase in the question box → Search.
4. Add a note, then add a photo or record audio. Confirm the warning and "Log saved".
5. Backup → Create backup. Open `/#/receive`, choose the file and enter the code.
6. Wait 2 minutes, or switch apps, and watch it lock.

## Run locally

```
npm install
npm run dev
npm run build
```

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, Dexie (IndexedDB), hash-wasm (Argon2id), Web Crypto, pdf-lib, vite-plugin-pwa, lucide-react.

## Roadmap

- On-device transcription of audio and video (opt-in, saved as a separate linked entry, labeled machine-generated).
- Review of the design and copy by domestic-violence advocates; legal review of recording-consent notices and evidence use.
- Optional time-limited sharing between devices (needs a server, which conflicts with "zero data", so it needs a careful design).
- More disguise themes and a native wrapper for background recording shortcuts.

## How this was built (disclosure)

TODO: check the Hacklanta rules and state honestly what existed before the event (the spec and early scaffold were prepared before building) and what was built during it. An AI coding assistant (Claude) helped write and test code; the team reviewed and tested the result.

## Team

@raidathingz · @PopaAnastasia · @RainaNicole06 (TODO: add names/roles if you like)

Original build spec for this project is kept in `docs/SPEC.md`.
