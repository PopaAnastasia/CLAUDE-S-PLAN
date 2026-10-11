export const GENESIS = '0'.repeat(64)

const enc = new TextEncoder()
const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export const sha256Text = async (s: string) =>
  hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
export const sha256Bytes = async (b: Uint8Array<ArrayBuffer>) =>
  hex(await crypto.subtle.digest('SHA-256', b))

// Each entry's hash covers its id, its content, its time and the previous hash.
export const chainHash = (
  i: { id: string; createdAt: string },
  contentHash: string,
  prev: string,
) => sha256Text(`${i.id}|${contentHash}|${i.createdAt}|${prev}`)
