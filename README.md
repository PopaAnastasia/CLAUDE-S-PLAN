# CLAUDE-S-PLAN
Hacklanta 2026
# Shake: Build Spec (for AI-assisted / vibe coding)

> How to use this file: paste the **Project Brief** section into your AI coding tool as persistent context (e.g., a `CLAUDE.md` / rules file), then feed it one **Milestone** at a time. Don't ask for the whole app in one prompt.

---

## 1. Project Brief

**Shake** is a mobile app that helps people in abusive situations quickly record evidence and reach help, while looking like an ordinary app (fitness tracker, recipe app, sleep tracker, calculator).

**Priorities, in order:**
1. User safety (never make discovery more likely or more dangerous)
2. Discretion (looks and behaves like a normal app)
3. Evidence integrity (tamper-evident, encrypted, backed up off-device)
4. Speed (a few taps from any screen)

**Non-negotiable rules for the code:**
- All evidence is encrypted on the client before it leaves the phone. The server never sees plaintext or keys.
- No analytics, ad, or crash-reporting SDKs that send user data. No accounts tied to real identity (no email or phone required).
- No push notifications, no badges, no sounds from the disguised app, except an opt-in generic reminder.
- App-switcher previews must be blank or show the disguise.
- Never claim "undetectable" or "tamper-proof" in UI copy.
- Recording is always started by the user. No hidden or automatic recording.
- No automatic dispatch to emergency services.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo (TypeScript), dev builds, not Expo Go | Fast to vibe-code, one codebase, supports native modules |
| Navigation | `expo-router` | Simple file-based routing |
| Secure storage | `expo-secure-store` (keys), `expo-file-system` (encrypted blobs) | OS keychain/keystore |
| Crypto | `react-native-libsodium` (or `expo-crypto` + `@noble/ciphers`); Argon2id for PIN KDF | Modern, audited primitives |
| Audio | `expo-audio` (or `expo-av`) | Recording |
| Camera | `expo-camera`, `expo-image-picker` | Photo/video notes |
| Location | `expo-location` | Foreground location for incident logs and trusted-contact alerts |
| Local DB | `expo-sqlite` (stores only encrypted payloads plus non-sensitive metadata) | Offline-first |
| Backend | Node + Fastify (TypeScript) | Small API |
| Object storage | AWS S3 with Object Lock (compliance mode) | Write-once evidence |
| Database | Postgres (or SQLite for MVP) | Share links, upload manifests |
| Timestamping | RFC 3161 TSA (e.g., a public TSA) | Trusted time proof |
| Share viewer | Static web page (Vite or Next.js) | Recipient needs no install |
| On-device transcription | `whisper.rn` (Whisper tiny/base) | Audio never leaves device for transcription |
| OCR (later) | Google ML Kit / Apple Vision via native module | Screenshot import |

---

## 3. Project Structure

```
shake/
  app/                      # expo-router screens
    (disguise)/             # one folder per theme shell
      fitness/
      recipes/
      sleep/
      calculator/
    (vault)/                # real vault screens (only after real PIN)
      evidence/
      record/
      share/
      alert/
      settings/
    help.tsx                # help screen (behaves differently per vault)
    lock.tsx                # PIN entry
  src/
    crypto/                 # kdf.ts, vault.ts, encrypt.ts, hash.ts
    storage/                # evidenceStore.ts, manifest.ts
    vault/                  # vaultManager.ts (real vs decoy)
    sync/                   # uploader.ts, retry queue
    share/                  # shareLinks.ts
    alerts/                 # trustedContacts.ts, alarm.ts
    themes/                 # theme definitions, icons, copy
    components/
  server/
    src/
      routes/ (upload, share, view)
      services/ (s3, timestamp, expiry)
  viewer/                   # static web viewer for shared evidence
  docs/
    THREAT_MODEL.md
    SAFETY_REVIEW.md
```

---

## 4. Core Concepts

### 4.1 Dual-vault PIN (signature feature)

- On first setup the user creates a **real PIN** and a **decoy PIN** (different, both 6 digits).
- Two vault headers always exist on disk, same size and structure. If no decoy is configured, the decoy header is filled with random bytes.
- Each header holds a wrapped vault key. Wrapping key = Argon2id(PIN, per-vault salt) combined with a device-bound key in secure storage.
- On PIN entry: try to unwrap header A, then header B (always try both, constant timing). Whichever succeeds decides the mode. If neither does, show "incorrect PIN" with the same delay as success.
- **Real mode:** full app. **Decoy mode:** same UI shell with a believable empty/lightly populated state, no evidence pathways, and the help screen shows only generic resources.
- Decoy mode must never reveal that a real vault exists (no "switch vault" UI, no settings entry).
- Rate-limit PIN attempts (exponential backoff). No wipe-on-failure by default (an abuser can trigger it); make that an explicit opt-in setting.

### 4.2 Disguise themes

Each theme is a **functioning mini-app** (so it survives casual inspection), with the Shake entrance hidden behind the PIN.

- **Calculator:** a working calculator. Enter PIN then `=` to unlock (default real-PIN entry method).
- **Fitness tracker:** step/workout log (local fake data entry works). A "Profile" screen has the PIN field.
- **Recipes:** list of recipes, search, favorites. Unlock via a search-bar PIN or a long-press.
- **Sleep tracker:** manual sleep log with a chart.
- The user picks the theme in Settings (and at first launch). Theme controls the in-app look. Android: also offer a launcher name/icon change. iOS: alternate icons only.
- Default app name should be neutral (e.g., "Daily"), not "Shake."

### 4.3 Evidence model

```ts
type EvidenceItem = {
  id: string;                 // uuid
  type: 'audio' | 'photo' | 'video' | 'note' | 'screenshot' | 'import';
  createdAt: string;          // device time, ISO
  location?: { lat: number; lng: number; accuracy: number };
  sha256: string;             // hash of plaintext at capture
  prevHash: string;           // hash chain: hash of previous manifest entry
  entryHash: string;          // sha256(id + sha256 + createdAt + prevHash)
  tsaToken?: string;          // RFC 3161 timestamp over entryHash (when online)
  transcriptId?: string;
  uploadStatus: 'local' | 'queued' | 'uploaded';
  userNote?: string;
};
```

- Files are encrypted with a per-item random key (XChaCha20-Poly1305). Item keys are wrapped with the vault key.
- Manifest is append-only and hash-chained. Any edit breaks the chain and is detectable.
- Upload when online: encrypted blob goes to S3 Object Lock. Manifest entries and TSA tokens are stored server-side.
- After confirmed upload, user can choose "remove local copy."

### 4.4 One-time sharing

1. User picks items and a duration (5 to 60 min, default 10).
2. App generates a random share key and re-wraps the selected item keys with it.
3. Server stores a share record: `id`, `expiresAt`, `maxViews`, wrapped keys, item blob references.
4. Link: `https://<host>/v/<shareId>#<shareKey>`. The key is in the URL fragment, so it is never sent to the server.
5. Viewer page fetches ciphertext, decrypts in the browser, shows read-only evidence plus a verification panel (hash, timestamp, chain check).
6. Link dies at expiry or when the view limit is reached. Server deletes share records afterward (evidence itself remains).
7. UI warning when sharing: "Sending this link may leave a trace in your messages. Delete the message after sending."

---

## 5. Feature List with Platform Notes

| Feature | Phase | Implementation | Platform notes |
|---|---|---|---|
| Disguise themes | 1 | Themed shells | Android can rename/re-icon; iOS alternate icons only |
| Dual-vault PIN | 1 | See 4.1 | Same on both |
| Help button | 1 | Header action styled as "Help" in every theme | `tel:` prompts for confirmation on iOS |
| Hotline directory | 1 | Local JSON, works offline | Country selector |
| Evidence recording (audio/photo/video/note) | 1 | User-started | Foreground only; mic indicator is shown by OS |
| Encrypted storage + hash chain | 1 | See 4.3 | |
| Upload and timestamps | 1 | Background upload queue | iOS background limits: upload on foreground |
| One-time sharing | 1 | See 4.4 | |
| Quick exit / panic gesture | 1 | Shake phone or triple-tap corner switches to decoy or closes app | |
| Silent alert to trusted contacts | 2 | Pre-composed SMS with live location link | iOS needs the user to confirm send from the Messages composer; Android can use a share intent or SMS permission (store policy caveats). Server-sent SMS via Twilio is an alternative |
| PIN-activated alarm | 2 | Loud siren plus location alert | iOS can't force volume; show a "turn volume up" prompt |
| On-device transcription | 2 | Whisper via `whisper.rn` | Label "machine-generated, may be inaccurate" |
| Screenshot/OCR import | 2 | Import images, OCR text, hash, timestamp | |
| WhatsApp export import | 2 | Parse exported `.txt`/zip | |
| Hardware shortcut to record | 3 | iOS: Back Tap/Action Button/Siri Shortcut that opens record screen. Android: accessibility or tile | Android accessibility needs Play policy review |
| Opt-in trigger words | 3 | User-started "listening mode," on-device keyword spotting | Battery, mic indicator, background limits. Be honest in UI |
| Emergency partner integration | 3 | Only with a signed partner (e.g., monitoring center) and legal review | |

**Explicitly out of scope:**
- Auto-dispatching to 911 or police.
- "No PIN response means send location to authorities" logic.
- Reading iMessage or SMS history directly.
- Hidden, always-on background recording.
- Claims of "immutable" evidence (use "tamper-evident").

---

## 6. Milestones (feed these to the AI one at a time)

### Milestone 0: Scaffold
**Prompt:** "Create an Expo (TypeScript) app using expo-router with the folder structure in this spec. Add ESLint, Prettier, and a basic test setup (Jest). Don't add any analytics or telemetry packages."

**Done when:** App runs on a dev build, folders exist, lint and tests pass.

### Milestone 1: Themes and lock screen
**Prompt:** "Build the calculator and fitness-tracker disguise shells as fully functional mini-apps. Add a theme picker in a setup flow. Add lock.tsx with PIN entry (calculator: PIN then `=`). For now, hardcode 'real' and 'decoy' PINs and route to placeholder screens."

**Done when:** Both themes work on their own, PIN routes to the right placeholder, and the app switcher shows a blank screen (use `expo-screen-capture` / blur on background).

### Milestone 2: Dual-vault crypto
**Prompt:** "Implement src/crypto and src/vault per section 4.1: Argon2id KDF, two fixed-size vault headers (random filler if decoy unset), device-bound key in SecureStore, constant-timing unlock trying both headers, exponential backoff on failures. Write unit tests including: wrong PIN, decoy PIN, no-decoy-configured, headers are indistinguishable in size."

**Done when:** Tests pass. A decoy unlock never exposes any real-vault data.

### Milestone 3: Evidence capture and manifest
**Prompt:** "Implement audio recording (start/stop/save), photo capture, and text notes in the real vault. Encrypt each with a per-item key, wrapped by the vault key. Implement the hash-chained manifest from section 4.3 in expo-sqlite. Add an evidence list with a 'Verify chain' button that recomputes hashes."

**Done when:** Tampering with any stored entry makes verification fail. Items decrypt only inside the real vault.

### Milestone 4: Help screen
**Prompt:** "Build help.tsx styled as a standard Help/Support page. In decoy mode show only generic FAQ content. In real mode show: a prominent 'Call 911' button, a 'Text a hotline' option, and a country-selectable directory of DV hotlines, legal aid, and shelters from a local JSON file. The entry button must be present in every theme's header."

**Done when:** Decoy mode has zero emergency or evidence UI. Real mode works offline.

### Milestone 5: Server, upload, timestamps
**Prompt:** "Create a Fastify server with endpoints: POST /upload (encrypted blob + manifest entry), GET /manifest. Store blobs in S3 with Object Lock. Add RFC 3161 timestamping of each entryHash and store the token. Build a client uploader with an offline retry queue. Anonymous device registration only (random device ID and keypair, no email/phone)."

**Done when:** Evidence recorded offline uploads once online. Server can't read plaintext. Timestamp tokens verify.

### Milestone 6: One-time sharing and viewer
**Prompt:** "Implement section 4.4: share creation in the app, share endpoints on the server (expiry, max views), and a static viewer page that decrypts in-browser using the key in the URL fragment. Show a verification panel. Add the trace warning in the share UI."

**Done when:** Link works once or until expiry, then returns a generic 'not found'. The server logs never contain the fragment key.

### Milestone 7: Quick exit and settings
**Prompt:** "Add a panic gesture (shake or triple-tap corner) that immediately returns to the disguise home screen and locks the vault. Add settings: change theme, change PINs, set trusted contacts, optional wipe-after-N-failed-attempts (off by default, with a warning)."

### Milestone 8: Phase 2 features
Build one at a time: trusted-contact silent alert, PIN-activated alarm, on-device transcription, screenshot/OCR import, WhatsApp export import.

### Milestone 9: Hardening and review
- Write `docs/THREAT_MODEL.md` (discovery via backups, notifications, permissions list, battery stats, screen recordings, shared device accounts).
- Disable iCloud/Google backup of the vault directory.
- Remove all logging of sensitive data.
- Dependency audit.
- Run a review with DV advocates before any real user touches it.

---

## 7. Acceptance Checklist (before any public release)

- [ ] Decoy mode exposes no hint of a real vault (UI, settings, storage size)
- [ ] No plaintext evidence on disk or server
- [ ] No third-party analytics or tracking SDKs
- [ ] App switcher preview is blank/disguised
- [ ] No notifications or badges from the disguised app by default
- [ ] Evidence chain verification detects any tampering
- [ ] One-time links expire and never leak keys to the server
- [ ] Recording-consent notice shown, with per-state guidance
- [ ] Marketing and UI copy contain no absolute safety claims
- [ ] Reviewed by at least one DV advocacy organization
- [ ] Legal review (recording laws, evidence admissibility, liability, app-store policy)

---

## 8. Legal and Safety Notes

- Recording consent laws vary by state. Georgia is one-party consent, but many states require all-party consent. Show a notice in the record screen.
- A disguised app can still be found through the permissions list, storage use, or network traffic. Say so in onboarding.
- Never present the app as a replacement for professional help or emergency services.
- Partner with advocates (e.g., NNEDV Safety Net) for threat modeling and user testing.
- Verify competitor claims (e.g., "only myPlan does a decoy PIN") before putting them in a pitch.

---

## 9. Helpful Prompts for Debugging

- "Add tests that prove X can't be recovered from the decoy vault."
- "Review this code for any place plaintext or key material could be logged or persisted."
- "List every OS-visible trace this app leaves (permissions, notifications, storage, network) and how to reduce each."
