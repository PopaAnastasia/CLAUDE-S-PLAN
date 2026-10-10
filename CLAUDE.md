Project: "Daily", a disguised evidence-log PWA (hackathon prototype).
Stack: React + TypeScript + Vite + Tailwind + Dexie + pdf-lib.
No other packages without asking. Do not edit README.md.

Hard rules:
- No accounts, analytics, trackers, or network calls with user data.
- Evidence encrypted on-device with Web Crypto (AES-GCM) before
  storage. Never write custom crypto. Never log PINs/keys/plaintext.
- Two PINs: real opens the real vault, decoy opens an empty,
  normal-looking one. Decoy must never reveal a real vault exists.
- Disguised as a working calculator. App name is "Daily".
- Never claim "undetectable" or "tamper-proof" in UI text.
- Change only what is asked. Don't refactor unrelated files.