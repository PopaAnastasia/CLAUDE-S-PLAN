import Dexie, { type Table } from 'dexie'
import { getVaultKey } from '../crypto/vault'

export type Kind = 'note' | 'chat' | 'photo' | 'audio' | 'video'

export type Item = {
  id: string
  createdAt: string
  kind: Kind
  title: string
  text?: string
  fileName?: string
  mime?: string
  size?: number
  fileHash?: string
}

export type Verify = { ok: boolean; count: number; problem?: string }

type Bytes = Uint8Array<ArrayBuffer>

type Row = {
  id: string
  seq: number
  iv: Bytes
  ct: Bytes // encrypted metadata + text
  fIv?: Bytes
  fCt?: Bytes // encrypted file bytes (photo / audio / video)
  prevHash: string
  entryHash: string
}

class LogDB extends Dexie {
  logs!: Table<Row, string>
  constructor() {
    super('dailyfit')
    this.version(1).stores({ logs: 'id, seq' })
  }
}
const db = new LogDB()

const GENESIS = '0'.repeat(64)
const MAX_FILE = 50 * 1024 * 1024 // 50 MB per file (demo limit)
const enc = new TextEncoder()
const dec = new TextDecoder()

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s: string) =>
  hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const sha256Bytes = async (b: Bytes) =>
  hex(await crypto.subtle.digest('SHA-256', b))

const needKey = () => {
  const k = getVaultKey()
  if (!k) throw new Error('locked')
  return k
}

async function seal(key: CryptoKey, data: Bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data),
  )
  return { iv, ct }
}
const open = async (key: CryptoKey, iv: Bytes, ct: Bytes) =>
  new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))

const chainHash = (i: Item, contentHash: string, prev: string) =>
  sha256(`${i.id}|${contentHash}|${i.createdAt}|${prev}`)

export async function addItem(input: {
  kind: Kind
  title: string
  text?: string
  file?: File
}): Promise<void> {
  const key = needKey()

  let fileBytes: Bytes | undefined
  let fileHash: string | undefined
  if (input.file) {
    if (input.file.size > MAX_FILE) throw new Error('too large')
    fileBytes = new Uint8Array(await input.file.arrayBuffer())
    fileHash = await sha256Bytes(fileBytes)
  }

  const item: Item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    kind: input.kind,
    title: input.title,
    text: input.text,
    fileName: input.file?.name,
    mime: input.file?.type || undefined,
    size: input.file?.size,
    fileHash, // the chain covers the file through this hash
  }
  const plain = JSON.stringify(item)
  const contentHash = await sha256(plain)

  const last = await db.logs.orderBy('seq').last()
  const seq = last ? last.seq + 1 : 1
  const prevHash = last ? last.entryHash : GENESIS
  const entryHash = await chainHash(item, contentHash, prevHash)

  const meta = await seal(key, enc.encode(plain))
  const row: Row = {
    id: item.id,
    seq,
    iv: meta.iv,
    ct: meta.ct,
    prevHash,
    entryHash,
  }
  if (fileBytes) {
    const f = await seal(key, fileBytes)
    row.fIv = f.iv
    row.fCt = f.ct
  }
  await db.logs.add(row)
}

export async function listItems(): Promise<Item[]> {
  const key = needKey()
  const rows = await db.logs.orderBy('seq').toArray()
  const out: Item[] = []
  for (const r of rows) {
    try {
      out.push(JSON.parse(dec.decode(await open(key, r.iv, r.ct))) as Item)
    } catch {
      /* unreadable entry: verifyChain reports it */
    }
  }
  return out.reverse() // newest first
}

// Decrypts one stored file for viewing or download.
export async function getFile(
  id: string,
): Promise<{ blob: Blob; name: string } | null> {
  const key = needKey()
  const r = await db.logs.get(id)
  if (!r || !r.fIv || !r.fCt) return null
  const meta = JSON.parse(dec.decode(await open(key, r.iv, r.ct))) as Item
  const bytes = await open(key, r.fIv, r.fCt)
  return {
    blob: new Blob([bytes], { type: meta.mime || 'application/octet-stream' }),
    name: meta.fileName || 'file',
  }
}

export async function verifyChain(): Promise<Verify> {
  const key = needKey()
  const rows = await db.logs.orderBy('seq').toArray()
  const fail = (problem: string): Verify => ({ ok: false, count: rows.length, problem })

  let prev = GENESIS
  let expected = 1
  for (const r of rows) {
    if (r.seq !== expected) return fail(`Entry ${expected} is missing.`)
    if (r.prevHash !== prev) return fail(`Entry ${r.seq} does not link to the one before it.`)

    let plain: string
    let item: Item
    try {
      plain = dec.decode(await open(key, r.iv, r.ct))
      item = JSON.parse(plain) as Item
    } catch {
      return fail(`Entry ${r.seq} was altered or cannot be decrypted.`)
    }

    const again = await chainHash(item, await sha256(plain), r.prevHash)
    if (again !== r.entryHash || item.id !== r.id) {
      return fail(`Entry ${r.seq} does not match its record.`)
    }

    if (item.fileHash) {
      if (!r.fIv || !r.fCt) return fail(`The file in entry ${r.seq} is missing.`)
      try {
        const bytes = await open(key, r.fIv, r.fCt)
        if ((await sha256Bytes(bytes)) !== item.fileHash) {
          return fail(`The file in entry ${r.seq} was altered.`)
        }
      } catch {
        return fail(`The file in entry ${r.seq} was altered or cannot be decrypted.`)
      }
    }

    prev = r.entryHash
    expected++
  }
  return { ok: true, count: rows.length }
}

export async function wipeEvidence() {
  await db.delete()
}

// DEMO ONLY: flips one bit in the oldest entry. Call it again to undo.
// Remove this before any real use.
export async function demoTamper() {
  const first = await db.logs.orderBy('seq').first()
  if (!first) return
  const ct = new Uint8Array(first.ct)
  ct[0] ^= 1
  await db.logs.update(first.id, { ct })
}
export type ExportRow = Item & { seq: number; entryHash: string }

export async function listForExport(): Promise<ExportRow[]> {
  const key = needKey()
  const rows = await db.logs.orderBy('seq').toArray()
  const out: ExportRow[] = []
  for (const r of rows) {
    try {
      const item = JSON.parse(dec.decode(await open(key, r.iv, r.ct))) as Item
      out.push({ ...item, seq: r.seq, entryHash: r.entryHash })
    } catch {
      /* skip unreadable entry; verifyChain reports it */
    }
  }
  return out
}