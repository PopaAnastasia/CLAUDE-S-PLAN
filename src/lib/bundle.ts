import { argon2id } from 'hash-wasm'
import { WORDS } from './words'
import type { BundleEntry } from './chain'

// File layout:
// "DFB1" | version(1) | memKiB(u32) | iterations(1) | salt(16) | iv(12) | AES-GCM ciphertext
// The header is authenticated (used as AAD). Plaintext:
// [u32 JSON length][JSON list of entries][file bytes, one after another]
export const CODE_WORDS = 5
export const MAX_BUNDLE = 120 * 1024 * 1024
const MAGIC = [0x44, 0x46, 0x42, 0x31]
const VERSION = 1
const MEM_KIB = 65536
const ITER = 3
const HEAD = 4 + 1 + 4 + 1 + 16 + 12

export function makeCode(): string {
  // 2048 words divides 65536 exactly, so there is no modulo bias.
  const r = crypto.getRandomValues(new Uint16Array(CODE_WORDS))
  return Array.from(r, (x) => WORDS[x % 2048]).join('-')
}

export const normalizeCode = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .join('-')

export const isValidCode = (s: string) => {
  const parts = normalizeCode(s).split('-')
  return parts.length === CODE_WORDS && parts.every((p) => WORDS.includes(p))
}

async function keyFrom(code: string, salt: Uint8Array, mem: number, iter: number) {
  const raw = await argon2id({
    password: normalizeCode(code),
    salt,
    parallelism: 1,
    iterations: iter,
    memorySize: mem,
    hashLength: 32,
    outputType: 'binary',
  })
  return crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

type Meta = { seq: number; prevHash: string; entryHash: string; plain: string; fileLen: number }

export async function encryptBundle(
  entries: BundleEntry[],
  code: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const meta: Meta[] = entries.map((e) => ({
    seq: e.seq,
    prevHash: e.prevHash,
    entryHash: e.entryHash,
    plain: e.plain,
    fileLen: e.file?.length ?? 0,
  }))
  const json = new TextEncoder().encode(JSON.stringify(meta))
  const total = 4 + json.length + meta.reduce((s, m) => s + m.fileLen, 0)
  if (total > MAX_BUNDLE) throw new Error('too large')
  const body = new Uint8Array(total)
  new DataView(body.buffer).setUint32(0, json.length)
  body.set(json, 4)
  let off = 4 + json.length
  for (const e of entries) {
    if (e.file) {
      body.set(e.file, off)
      off += e.file.length
    }
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const head = new Uint8Array(HEAD)
  head.set(MAGIC, 0)
  head[4] = VERSION
  new DataView(head.buffer).setUint32(5, MEM_KIB)
  head[9] = ITER
  head.set(salt, 10)
  head.set(iv, 26)
  const key = await keyFrom(code, salt, MEM_KIB, ITER)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: head }, key, body),
  )
  const out = new Uint8Array(HEAD + ct.length)
  out.set(head, 0)
  out.set(ct, HEAD)
  return out
}

// Throws Error('bad') for a wrong code, a damaged file, or a file that isn't a bundle.
export async function decryptBundle(
  data: Uint8Array<ArrayBuffer>,
  code: string,
): Promise<BundleEntry[]> {
  if (data.length < HEAD + 16 || data.length > MAX_BUNDLE + 1024) throw new Error('bad')
  if (!MAGIC.every((b, i) => data[i] === b) || data[4] !== VERSION) throw new Error('bad')
  const head = data.slice(0, HEAD)
  const mem = new DataView(head.buffer).getUint32(5)
  const iter = head[9]
  if (mem < 1024 || mem > 262144 || iter < 1 || iter > 10) throw new Error('bad')
  const salt = head.slice(10, 26)
  const iv = head.slice(26, 38)
  let body: Uint8Array<ArrayBuffer>
  try {
    const key = await keyFrom(code, salt, mem, iter)
    body = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: head },
        key,
        data.slice(HEAD),
      ),
    )
  } catch {
    throw new Error('bad')
  }
  try {
    const jl = new DataView(body.buffer).getUint32(0)
    if (4 + jl > body.length) throw new Error('bad')
    const meta = JSON.parse(new TextDecoder().decode(body.slice(4, 4 + jl))) as Meta[]
    let off = 4 + jl
    const out: BundleEntry[] = []
    for (const m of meta) {
      if (typeof m.plain !== 'string' || typeof m.fileLen !== 'number') throw new Error('bad')
      const e: BundleEntry = {
        seq: m.seq,
        prevHash: m.prevHash,
        entryHash: m.entryHash,
        plain: m.plain,
      }
      if (m.fileLen > 0) {
        if (off + m.fileLen > body.length) throw new Error('bad')
        e.file = body.slice(off, off + m.fileLen)
        off += m.fileLen
      }
      out.push(e)
    }
    return out
  } catch {
    throw new Error('bad')
  }
}
