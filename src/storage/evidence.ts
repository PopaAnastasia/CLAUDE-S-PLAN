import Dexie, { type Table } from 'dexie'
import { getVaultKey } from '../crypto/vault'
import { GENESIS, chainHash, sha256Bytes, sha256Text } from '../lib/hash'
import {
  verifyEntries,
  type BundleEntry,
  type ExportRow,
  type Item,
  type Kind,
  type Verify,
} from '../lib/chain'

export type { ExportRow, Item, Kind, Verify }

// There is deliberately no function here that edits or deletes an entry.
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

export const MAX_FILE = 50 * 1024 * 1024
const enc = new TextEncoder()
const dec = new TextDecoder()

const needKey = () => {
  const k = getVaultKey()
  if (!k) throw new Error('locked')
  return k
}

async function seal(key: CryptoKey, data: Bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  return { iv, ct }
}
const open = async (key: CryptoKey, iv: Bytes, ct: Bytes) =>
  new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))

// Saves happen one at a time, so two quick saves can't take the same position.
let queue: Promise<unknown> = Promise.resolve()
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn)
  queue = run.catch(() => undefined)
  return run
}

export type NewItem = {
  kind: Kind
  title: string
  text?: string
  file?: File | Blob
  fileName?: string
  happenedAt?: string
  capturedAt?: string
  capturedFrom?: 'recording' | 'file'
}

export function addItem(input: NewItem): Promise<void> {
  return serial(async () => {
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
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      kind: input.kind,
      title: input.title,
      text: input.text,
      fileName: input.file ? (input.fileName ?? (input.file as File).name ?? 'file') : undefined,
      mime: input.file?.type || undefined,
      size: input.file?.size,
      fileHash,
      happenedAt: input.happenedAt,
      capturedAt: input.capturedAt,
      capturedFrom: input.capturedFrom,
    }
    const plain = JSON.stringify(item)
    const contentHash = await sha256Text(plain)

    const last = await db.logs.orderBy('seq').last()
    const seq = last ? last.seq + 1 : 1
    const prevHash = last ? last.entryHash : GENESIS
    const entryHash = await chainHash(item, contentHash, prevHash)

    const meta = await seal(key, enc.encode(plain))
    const row: Row = { id: item.id, seq, iv: meta.iv, ct: meta.ct, prevHash, entryHash }
    if (fileBytes) {
      const f = await seal(key, fileBytes)
      row.fIv = f.iv
      row.fCt = f.ct
    }
    await db.logs.add(row) // add() refuses to overwrite an existing id
  })
}

export const countItems = () => db.logs.count()

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

export async function getFile(id: string): Promise<{ blob: Blob; name: string } | null> {
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

// Reads everything back as exact text + file bytes (used to verify and to back up).
export async function readAllEntries(): Promise<BundleEntry[]> {
  const key = needKey()
  const rows = await db.logs.orderBy('seq').toArray()
  const out: BundleEntry[] = []
  for (const r of rows) {
    let plain: string
    try {
      plain = dec.decode(await open(key, r.iv, r.ct))
    } catch {
      plain = '\u0000unreadable'
    }
    const e: BundleEntry = { seq: r.seq, prevHash: r.prevHash, entryHash: r.entryHash, plain }
    if (r.fIv && r.fCt) {
      try {
        e.file = await open(key, r.fIv, r.fCt)
      } catch {
        e.file = new Uint8Array(0)
      }
    }
    out.push(e)
  }
  return out
}

export async function verifyChain(): Promise<Verify> {
  const entries = await readAllEntries()
  const v = await verifyEntries(entries)
  return v
}

export async function listForExport(): Promise<ExportRow[]> {
  const entries = await readAllEntries()
  const out: ExportRow[] = []
  for (const e of entries) {
    try {
      out.push({ ...(JSON.parse(e.plain) as Item), seq: e.seq, entryHash: e.entryHash })
    } catch {
      /* skip unreadable entry; verifyChain reports it */
    }
  }
  return out
}

// Restore into an EMPTY journal only. Verified first; same hashes are kept.
export function restoreEntries(entries: BundleEntry[]): Promise<void> {
  return serial(async () => {
    const key = needKey()
    if ((await db.logs.count()) > 0) throw new Error('not empty')
    const v = await verifyEntries(entries)
    if (!v.ok) throw new Error('invalid')
    const rows: Row[] = []
    for (const e of entries) {
      const item = JSON.parse(e.plain) as Item
      const meta = await seal(key, enc.encode(e.plain))
      const row: Row = {
        id: item.id,
        seq: e.seq,
        iv: meta.iv,
        ct: meta.ct,
        prevHash: e.prevHash,
        entryHash: e.entryHash,
      }
      if (e.file) {
        const f = await seal(key, e.file)
        row.fIv = f.iv
        row.fCt = f.ct
      }
      rows.push(row)
    }
    await db.transaction('rw', db.logs, async () => {
      if ((await db.logs.count()) > 0) throw new Error('not empty')
      await db.logs.bulkAdd(rows)
    })
  })
}
