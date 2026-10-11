import { GENESIS, chainHash, sha256Bytes, sha256Text } from './hash'

export type Kind = 'note' | 'chat' | 'photo' | 'audio' | 'video'

export type Item = {
  id: string
  createdAt: string // when the entry was saved here (device clock)
  tz?: string // time zone of the device when saved
  kind: Kind
  title: string
  text?: string
  fileName?: string
  mime?: string
  size?: number
  fileHash?: string
  happenedAt?: string // when the person says it happened (optional, typed by them)
  capturedAt?: string // when the file was recorded/created (recording time, or file's date)
  capturedFrom?: 'recording' | 'file'
}

export type Verify = {
  ok: boolean
  count: number
  problem?: string
  notices: string[]
}

export type BundleEntry = {
  seq: number
  prevHash: string
  entryHash: string
  plain: string // exact JSON text that was hashed
  file?: Uint8Array<ArrayBuffer>
}

export type ExportRow = Item & { seq: number; entryHash: string }

// Checks a whole list of entries: order, links, hashes and files.
export async function verifyEntries(entries: BundleEntry[]): Promise<Verify> {
  const notices: string[] = []
  const fail = (problem: string): Verify => ({
    ok: false,
    count: entries.length,
    problem,
    notices,
  })
  let prev = GENESIS
  let expected = 1
  let lastTime = ''
  for (const e of entries) {
    if (e.seq !== expected) return fail(`Entry ${expected} is missing.`)
    if (e.prevHash !== prev)
      return fail(`Entry ${e.seq} does not link to the one before it.`)

    let item: Item
    try {
      item = JSON.parse(e.plain) as Item
    } catch {
      return fail(`Entry ${e.seq} is damaged.`)
    }
    const again = await chainHash(item, await sha256Text(e.plain), e.prevHash)
    if (again !== e.entryHash) return fail(`Entry ${e.seq} does not match its record.`)

    if (item.fileHash) {
      if (!e.file) return fail(`The file in entry ${e.seq} is missing.`)
      if ((await sha256Bytes(e.file)) !== item.fileHash)
        return fail(`The file in entry ${e.seq} was altered.`)
    }

    const t = Date.parse(item.createdAt)
    if (Number.isNaN(t)) return fail(`Entry ${e.seq} has no valid time.`)
    if (lastTime && item.createdAt < lastTime)
      notices.push(
        `Entry ${e.seq} is dated earlier than the entry before it. The phone's clock may have been changed.`,
      )
    lastTime = item.createdAt

    prev = e.entryHash
    expected++
  }
  return { ok: true, count: entries.length, notices }
}
