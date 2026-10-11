Project: "Shake", a disguised evidence-log PWA (hackathon prototype).
Stack: React + TypeScript + Vite + Tailwind + Dexie + pdf-lib.
No other packages without asking. Do not edit README.md.

Hard rules:
- No accounts, analytics, trackers, or network calls with user data.
- Evidence encrypted on-device with Web Crypto (AES-GCM) before
  storage. Never write custom crypto. Never log PINs/keys/plaintext.
- Two phrases, typed into Help -> "Ask a question": the private phrase
  opens the journal; the decoy (or any other text) shows normal help
  search results. Decoy must never reveal a journal exists.
- Setup is reachable only via the setup code (src/lib/access.ts) in the
  Help search, and only before a journal exists. Nothing in Profile,
  Settings or other public screens may mention the journal.
- Disguised as a working fitness tracker. App name is "Shake".
- Never claim "undetectable" or "tamper-proof" in UI text.
- Change only what is asked. Don't refactor unrelated files.