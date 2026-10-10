import { argon2id } from 'hash-wasm'

export type VaultMode = 'real' | 'decoy'
type Opened = { mode: VaultMode; key: CryptoKey } | null

// Every header is exactly the same size, so real, decoy and filler
// look identical on disk:
// salt (16) | iv (12) | encrypted [1 mode byte + 32 key bytes + 16 tag]
const SALT_LEN = 16
const IV_LEN = 12
const KEY_LEN = 32
const HEADER_LEN = SALT_LEN + IV_LEN + 1 + KEY_LEN + 16 // 77 bytes
const SLOT_KEYS = ['daily.cfg.0', 'daily.cfg.1'] // neutral names

export const MIN_SECRET_LEN = 8

let session: { mode: VaultMode; key: CryptoKey } | null = null

const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n))
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
const fromB64 = (s: string) =>
  new Uint8Array(Array.from(atob(s), (c) => c.charCodeAt(0)))

// Ignore capitals and extra spaces, so "How do I..." and "how  do i..." match
export const normalizeSecret = (s: string) =>
  s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')

// secret + salt -> encryption key (slow on purpose, to resist guessing)
async function deriveKek(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const raw = await argon2id({
    password: secret,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 32768, // 32 MiB
    hashLength: 32,
    outputType: 'binary',
  })
  return crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

async function makeHeader(secret: string, mode: VaultMode): Promise<Uint8Array> {
  const salt = rand(SALT_LEN)
  const iv = rand(IV_LEN)
  const plain = new Uint8Array(1 + KEY_LEN)
  plain[0] = mode === 'real' ? 1 : 2
  plain.set(rand(KEY_LEN), 1) // this vault's random master key
  const kek = await deriveKek(secret, salt)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, plain),
  )
  plain.fill(0)
  const out = new Uint8Array(HEADER_LEN)
  out.set(salt, 0)
  out.set(iv, SALT_LEN)
  out.set(ct, SALT_LEN + IV_LEN)
  return out
}

async function tryOpen(header: Uint8Array, secret: string): Promise<Opened> {
  const salt = header.slice(0, SALT_LEN)
  const iv = header.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const ct = header.slice(SALT_LEN + IV_LEN)
  const kek = await deriveKek(secret, salt)
  try {
    const plain = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, ct),
    )
    const mode: VaultMode | null =
      plain[0] === 1 ? 'real' : plain[0] === 2 ? 'decoy' : null
    if (!mode) return null
    const key = await crypto.subtle.importKey(
      'raw',
      plain.slice(1),
      'AES-GCM',
      false, // not extractable
      ['encrypt', 'decrypt'],
    )
    plain.fill(0)
    return { mode, key }
  } catch {
    return null // wrong secret, or this slot is just random filler
  }
}

export const isVaultConfigured = () =>
  SLOT_KEYS.every((k) => localStorage.getItem(k) !== null)

export async function setupVault(
  realSecret: string,
  decoySecret: string | null,
) {
  const realText = normalizeSecret(realSecret)
  const decoyText = decoySecret === null ? null : normalizeSecret(decoySecret)
  if (realText.length < MIN_SECRET_LEN) throw new Error('too short')
  if (
    decoyText !== null &&
    (decoyText.length < MIN_SECRET_LEN || decoyText === realText)
  )
    throw new Error('bad decoy')

  const real = await makeHeader(realText, 'real')
  // No decoy chosen? Fill the slot with random bytes of the same size.
  const decoy = decoyText ? await makeHeader(decoyText, 'decoy') : rand(HEADER_LEN)
  // Random slot order, so position never reveals which one is real.
  const slots = (rand(1)[0] & 1) === 0 ? [real, decoy] : [decoy, real]
  SLOT_KEYS.forEach((k, i) => localStorage.setItem(k, toB64(slots[i])))
}

export async function unlockVault(secret: string): Promise<VaultMode | null> {
  const text = normalizeSecret(secret)
  const headers = SLOT_KEYS.map((k) => localStorage.getItem(k))
  if (text === '' || headers.some((h) => h === null)) return null

  // Always try BOTH slots so timing doesn't reveal which one matched.
  const results: Opened[] = []
  for (const h of headers) results.push(await tryOpen(fromB64(h ?? ''), text))

  const hit = results.find((r) => r !== null) ?? null
  if (!hit) return null
  session = hit
  return hit.mode
}

export const lockVault = () => {
  session = null
}
export const getVaultKey = () => session?.key ?? null
export const getVaultMode = () => session?.mode ?? null