# CLAUDE-S-PLAN
Hacklanta 2026
# Shake (PWA): Build Spec for Any AI Coding Assistant

## How to use this file with any AI tool

This spec is tool-agnostic. It works with any AI coding assistant or chat model.

1. **Save it** in your project root as `SPEC.md`.
2. **Give the AI persistent context.** Paste Section 1 (Project Brief and Rules) into whatever your tool uses for standing instructions (a rules file, system prompt, custom instructions, or the first message of a chat).
3. **Build one milestone at a time** (Section 8). Paste the milestone's prompt, run the result, check its "Done when" line, then move on.
4. **Re-paste Section 1** whenever the AI starts drifting from the rules or the chat gets long.
5. **Review security-critical code yourself** (crypto, vault, storage, share links). AI-generated code in these areas often looks right but is subtly wrong. Ask the AI to write tests first.

Suggested opening message for any chat: *"Read this spec. We'll build it one milestone at a time. Before coding each milestone, tell me your plan and which files you'll create or change. If anything I ask conflicts with the rules in Section 1, tell me instead of silently complying."*

---

## 1. Project Brief and Rules

**Shake** is a Progressive Web App (PWA) that helps people in abusive situations quickly record evidence and reach help, while looking like an ordinary app (calculator, recipes, fitness tracker, sleep tracker).

**Priorities, in order:**
1. User safety: never make discovery more likely or more dangerous.
2. Discretion: looks and behaves like a normal app.
3. Evidence integrity: encrypted, tamper-evident, backed up off-device.
4. Speed: a few taps from any screen.

**Hard rules (never violate):**
- Evidence is encrypted **in the browser** before it leaves the device. The server never sees plaintext or keys.
- No analytics, ads, or third-party scripts that send user data. No external CDNs for scripts or fonts (bundle everything). No accounts tied to real identity (no email or phone required).
- No notifications, badges, or sounds from the disguised app by default.
- Never log PINs, keys, evidence contents, or locations, on the client or the server.
- Recording is always started by the user. No hidden or automatic recording.
- No automatic dispatch to emergency services. Alerts go to the user's trusted contacts.
- Never write "undetectable," "untraceable," or "tamper-proof" in UI copy. Use "tamper-evident."
- Decoy mode must never reveal that a real vault exists (no switch UI, no settings entry, no storage-size difference).
- The service worker must never cache sensitive responses (evidence, shares, manifests).
- If a browser limitation blocks a requested feature, say so and propose the closest feasible alternative. Do not fake it.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript | Fast to build, easy for AI tools to work with |
| Routing | React Router | One route tree per theme shell |
| PWA | `vite-plugin-pwa` (Workbox) | Service worker, offline shell, manifests |
| Local storage | IndexedDB (via `idb`) | Encrypted blobs only; non-sensitive metadata separate |
| Crypto | `libsodium-wrappers-sumo` (WASM) | Argon2id (PIN KDF), XChaCha20-Poly1305, SHA-256. Web Crypto API as a fallback for hashing |
| Media | `MediaRecorder`, `getUserMedia`, Geolocation API, Screen Wake Lock API | Format differs by browser (see 5.4) |
| Backend | Node + Fastify (TypeScript) | Small API |
| Object storage | AWS S3 with Object Lock (compliance mode) | Write-once evidence blobs |
| Database | SQLite (MVP) or Postgres | Share records, upload manifests |
| Timestamps | RFC 3161 timestamp authority | Proof of existence at a time |
| Share viewer | Separate route in the same PWA, or a static page | Recipient needs no install and no account |
| Tests | Vitest (unit), Playwright (end-to-end) | |

---

## 3. Project Structure

```
shake/
  public/
    icons/                  # per-theme icon sets
    manifests/              # calculator.webmanifest, recipes.webmanifest, ...
  src/
    themes/
      calculator/           # working mini-app + hidden unlock
      recipes/
      fitness/
      sleep/
    vault/                  # real + decoy screens (after PIN)
      evidence/ record/ share/ alert/ settings/
    pages/
      Help.tsx
      Lock.tsx
      Install.tsx           # per-theme install instructions
      Viewer.tsx            # one-time share viewer
    lib/
      crypto/               # kdf.ts, vault.ts, encrypt.ts, hash.ts
      storage/              # db.ts, evidenceStore.ts, manifest.ts
      sync/                 # uploader.ts, retryQueue.ts
      share/                # shareLinks.ts
      alerts/               # trustedContacts.ts, alarm.ts
    sw.ts                   # service worker
  server/
    src/
      routes/               # upload, share, view
      services/             # s3, timestamp, expiry
  docs/
    THREAT_MODEL.md
    SAFETY_REVIEW.md
  tests/
```

---

## 4. Core Designs

### 4.1 Dual-vault PIN (signature feature)

- User sets a **real PIN** and a **decoy PIN** (6 digits each, different from each other).
- Two vault headers always exist in IndexedDB with identical size and structure. If no decoy is set, its header is random bytes of the same length.
- Each header holds a wrapped vault key. Wrapping key = Argon2id(PIN, per-vault salt).
- On PIN entry: **always try both headers**, with constant timing. Success picks the mode. Failure shows "incorrect PIN" after the same delay as success.
- **Real mode:** full app. **Decoy mode:** same UI shell, empty or lightly populated, no evidence pathways, help screen shows only generic resources.
- Rate-limit attempts with exponential backoff (store counters in a way that doesn't reveal the real vault). Wipe-after-failures is opt-in only, off by default, since an abuser could trigger it.
- Honest limitation: a browser has no hardware-backed key store comparable to a native keychain, so PIN strength matters more. Use Argon2id with strong parameters and encourage 6+ digits.

### 4.2 Disguise themes

Each theme is a **working mini-app** so it survives casual inspection. The Shake entrance is hidden behind the PIN.

- **Calculator:** a functioning calculator. Enter the PIN, then `=`.
- **Recipes:** list, search, favorites. Unlock via a search-bar PIN or long-press on a logo.
- **Fitness:** simple local workout/step log. Unlock via a profile field.
- **Sleep:** manual sleep log and chart.

**PWA identity is fixed at install time.** Each theme lives at its own path (e.g., `/c/` for calculator, `/r/` for recipes) with its **own manifest** (name, icon, `start_url`, `scope`, theme color). The user chooses the theme *before* installing. The in-app look can't change the home-screen name or icon afterward; to switch, the user must delete and reinstall. Use neutral names ("Calc", "Recipes", "Daily").

### 4.3 Install flow and browser-trace hygiene

A PWA opened in a normal browser tab leaves history. The onboarding page (`Install.tsx`) must:
- Show per-platform steps: iOS Safari "Add to Home Screen"; Android Chrome "Install app" / "Add to Home screen."
- Tell the user to **open the app from the home-screen icon only**, then **clear the browser history entry** for the site (with steps for each browser).
- Recommend a neutral-looking domain.
- Include a **quick-exit** control on this page.
- Warn that installed apps appear in app lists, storage settings, and device backups.

### 4.4 Evidence model

```ts
type EvidenceItem = {
  id: string;                    // uuid
  type: 'audio' | 'photo' | 'video' | 'note' | 'screenshot' | 'import';
  mimeType?: string;
  createdAt: string;             // device time, ISO
  location?: { lat: number; lng: number; accuracy: number };
  sha256: string;                // hash of plaintext at capture
  prevHash: string;              // previous manifest entry's entryHash
  entryHash: string;             // sha256(id + sha256 + createdAt + prevHash)
  tsaToken?: string;             // RFC 3161 token over entryHash
  transcriptId?: string;
  uploadStatus: 'local' | 'queued' | 'uploaded';
  userNote?: string;
};
```

- Each item is encrypted with a random per-item key (XChaCha20-Poly1305), and the key is wrapped by the vault key.
- The manifest is append-only and hash-chained. Editing any entry breaks the chain.
- Upload to S3 Object Lock when online; the user may then delete the local copy.
- Request persistent storage with `navigator.storage.persist()`, and **upload early and often**, since browsers can evict storage and users can clear site data.

### 4.5 One-time sharing

1. User selects items and a duration (5 to 60 min, default 10).
2. App generates a random share key and re-wraps the selected item keys with it.
3. Server stores a share record: `id`, `expiresAt`, `maxViews`, wrapped keys, blob references.
4. Link: `https://<host>/v/<shareId>#<shareKey>`. The key is in the URL fragment, so it never reaches the server or its logs.
5. Viewer fetches ciphertext, decrypts in-browser, and is read-only. A verification panel shows hashes, timestamps, and chain status.
6. After expiry or the view limit, the link returns a generic "not found." The server deletes share records afterward (evidence blobs stay).
7. Share UI warns that sending the link may leave a trace in the user's messages, and explains how to delete it.
8. The viewer page must set `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.

---

## 5. Features and Browser Realities

### 5.1 Feature table

| Feature | Phase | PWA notes |
|---|---|---|
| Disguise themes with per-theme manifests | 1 | Identity fixed at install |
| Dual-vault PIN | 1 | See 4.1 |
| Help button and hotline directory | 1 | Works offline; `tel:` links; iOS shows a dial confirmation |
| Evidence capture (audio, photo, video, note) | 1 | Foreground only |
| Encrypted storage and hash chain | 1 | IndexedDB |
| Upload, timestamps, retry queue | 1 | Upload while the app is open; Background Sync is limited, especially on iOS |
| One-time sharing and viewer | 1 | See 4.5 |
| Quick-exit gesture | 1 | Shake (`devicemotion`, needs permission on iOS), or triple-tap a corner, or a visible button |
| Silent alert to trusted contacts | 2 | `sms:` link with a location URL opens the composer for the user to confirm; or a server-sent SMS provider (cost and privacy trade-offs) |
| PIN-activated alarm | 2 | Web Audio siren. Browsers can't force volume; prompt the user |
| Transcription | 2 | In-browser Whisper (WASM/WebGPU) is heavy on phones; make it optional or run only while charging. Server-side transcription would break the zero-plaintext rule |
| Screenshot/OCR import | 2 | Tesseract.js in-browser |
| WhatsApp export import | 2 | Parse exported `.txt`/zip locally |
| Hardware-button recording | Not possible in PWA | Closest: a Siri Shortcut / Android shortcut that opens the record screen directly |
| Trigger words | Not feasible in PWA | No background mic. Possible later only via a native wrapper |
| Emergency partner integration | 3 | Needs a partner agreement and legal review |
| Native wrapper (Capacitor) | 3 | Optional, for better background and shortcut behavior |

### 5.2 Explicitly out of scope
- Auto-dispatch to 911 or police.
- "No PIN response means send location to authorities."
- Reading iMessage or SMS history directly.
- Hidden or always-on background recording.
- Claims of "immutable" evidence (say tamper-evident).

### 5.3 Help screen rules
- Styled as an ordinary Help/Support page, with an entry button in every theme's header.
- **Real mode:** prominent "Call 911" button, a "Text a hotline" option, and a country-selectable directory of DV hotlines, legal aid, and shelters (local JSON, works offline).
- **Decoy mode:** generic FAQ only. No emergency options, no evidence links.

### 5.4 Browser quirks to handle
- `MediaRecorder` output differs: Chrome/Android often gives `audio/webm`; iOS Safari gives `audio/mp4`. Detect with `MediaRecorder.isTypeSupported` and store the MIME type with each item.
- Recording stops if the screen locks or the app is backgrounded. Use the Screen Wake Lock API during recording and show a clear "keep screen on" state. Save partial recordings in short chunks so little is lost.
- iOS home-screen apps use storage separate from Safari. Data saved in a browser tab will not appear in the installed app.
- Permissions (mic, camera, location) are requested at runtime and may be revoked by the user. Handle denial gracefully.
- The OS shows a mic/camera indicator while recording; this can't be hidden.

---

## 6. Service Worker and Cache Rules

- Cache only the **static app shell** (HTML, JS, CSS, icons) so the app opens offline.
- Never cache API responses, evidence blobs, manifests, or share data. Use `no-store` on those routes.
- Use a stable, boring cache name. Version caches so old shells are cleaned up.
- Ensure the viewer route is never precached.

---

## 7. Security Headers (server and static host)

- `Content-Security-Policy`: restrict to `self`; no inline scripts; no third-party origins.
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HTTPS only)
- `Cache-Control: no-store` on all API and viewer responses
- Disable server access logs of URLs where possible; never log fragments, headers with keys, or IPs beyond what abuse prevention needs (and delete quickly).

---

## 8. Milestones (give these to the AI one at a time)

### Milestone 0: Scaffold
**Prompt:** "Create a Vite + React + TypeScript project with `vite-plugin-pwa`, React Router, Vitest, Playwright, ESLint, and Prettier, following the folder structure in Section 3. Do not add analytics, tracking, or external CDN links. Bundle all fonts and assets locally."
**Done when:** App builds, runs, installs as a PWA locally, tests and lint pass.

### Milestone 1: Themes, manifests, lock screen
**Prompt:** "Build the calculator and recipes themes as fully working mini-apps at `/c/` and `/r/`, each with its own web manifest (neutral name, icon, start_url, scope). Add a theme chooser landing page and an Install page with per-platform instructions and the browser-history warning. Add a Lock screen: calculator unlocks with PIN then `=`. For now, route hardcoded 'real' and 'decoy' PINs to placeholder screens."
**Done when:** Each theme installs with the correct name and icon, works offline, and the PIN routes to the right placeholder.

### Milestone 2: Dual-vault crypto
**Prompt:** "Implement `src/lib/crypto` and the vault manager per Section 4.1 using libsodium (Argon2id, XChaCha20-Poly1305). Two fixed-size headers always stored; random filler if no decoy; try both headers with constant timing; exponential backoff on failures. Write tests first: wrong PIN, decoy PIN, no decoy configured, header size indistinguishability, no plaintext key material persisted."
**Done when:** All tests pass and a decoy unlock exposes nothing from the real vault.

### Milestone 3: Evidence capture and manifest
**Prompt:** "In the real vault, implement audio recording (MediaRecorder with MIME detection, chunked saving, Wake Lock), photo capture, and text notes. Encrypt each item with a per-item key wrapped by the vault key, store in IndexedDB, and build the hash-chained manifest from Section 4.4. Add an evidence list and a 'Verify chain' button."
**Done when:** Tampering with any stored entry makes verification fail; items only decrypt in the real vault.

### Milestone 4: Help screen
**Prompt:** "Build Help.tsx per Section 5.3, with an entry button in every theme's header. Real mode shows emergency options and the offline hotline directory; decoy mode shows generic FAQ only."
**Done when:** Decoy mode has no emergency or evidence UI; real mode works offline.

### Milestone 5: Server, upload, timestamps
**Prompt:** "Create a Fastify server with POST /upload (encrypted blob plus manifest entry) and GET /manifest, storing blobs in S3 with Object Lock. Add RFC 3161 timestamping of each entryHash. Build a client uploader with an offline retry queue. Anonymous device registration only (random ID and keypair). Apply the security headers in Section 7."
**Done when:** Offline-recorded evidence uploads once online; the server cannot read plaintext; timestamp tokens verify.

### Milestone 6: One-time sharing and viewer
**Prompt:** "Implement Section 4.5: share creation, server endpoints with expiry and max views, and the viewer route that decrypts in-browser using the URL fragment key. Include the verification panel, the trace warning, and `no-referrer` and `no-store` headers."
**Done when:** The link works until expiry or the view limit, then shows a generic 'not found'; server logs contain no keys.

### Milestone 7: Quick exit and settings
**Prompt:** "Add a quick-exit gesture (triple-tap corner, shake with permission prompt, and a visible button) that instantly locks the vault and returns to the disguise home. Add settings: change PINs, set trusted contacts, optional wipe-after-failed-attempts (off by default, with a warning)."
**Done when:** Exit works from every screen in under a second.

### Milestone 8: Phase 2 features (one at a time)
Trusted-contact alert (`sms:` link with location), PIN-activated alarm, optional transcription, screenshot/OCR import, WhatsApp export import. Remaining themes (fitness, sleep) can be added here too.

### Milestone 9: Hardening and review
**Prompt:** "Audit the codebase for: any logging of PINs, keys, evidence, or locations; any place plaintext could be persisted or cached; service worker caching of sensitive routes; missing security headers; dependency vulnerabilities. Write docs/THREAT_MODEL.md covering discovery through browser history, app lists, backups, shared device accounts, screen sharing, and network monitoring."
**Done when:** Findings are fixed and reviewed by a person, then by DV advocates.

---

## 9. Acceptance Checklist (before any public release)

- [ ] Decoy mode reveals nothing about a real vault (UI, settings, storage size)
- [ ] No plaintext evidence in IndexedDB, caches, or on the server
- [ ] No third-party scripts, fonts, analytics, or trackers
- [ ] Service worker caches only the static shell
- [ ] Each theme installs with a neutral name and icon
- [ ] Install page explains browser-history cleanup
- [ ] Evidence chain verification detects any tampering
- [ ] Share links expire and never expose keys to the server
- [ ] Recording-consent notice shown, with per-state guidance
- [ ] No absolute safety claims in UI or marketing copy
- [ ] Reviewed by at least one DV advocacy organization
- [ ] Legal review (recording laws, evidence admissibility, liability)

---

## 10. Legal and Safety Notes

- Recording consent laws vary by state. Georgia is one-party consent; many states require all parties. Show a notice on the record screen.
- A disguised app can still be found through app lists, storage settings, backups, network traffic, or browser history. Say so plainly in onboarding.
- The app does not replace professional help or emergency services.
- Work with DV advocates (e.g., NNEDV Safety Net) for threat modeling and user testing before real users depend on it.
- Verify any competitor claims (for example, that only one other app offers a decoy PIN) before using them in a pitch.

---

## 11. Handy Follow-up Prompts for Any AI

- "Write tests proving nothing from the real vault can be recovered in decoy mode."
- "Review this file for any place plaintext or key material could be logged, cached, or persisted."
- "List every trace this PWA leaves on the device (history, app list, storage, cache, network) and how to reduce each."
- "Explain this crypto code line by line so I can verify it."
