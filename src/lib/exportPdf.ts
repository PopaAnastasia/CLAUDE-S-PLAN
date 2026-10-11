import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { listForExport, verifyChain } from '../storage/evidence'
import type { ExportRow, Verify } from './chain'
import { fmtSize, fmtTime } from './format'

// pdf-lib's built-in fonts only support Latin-1. Turn odd spaces into plain
// spaces first (toLocaleString uses U+202F), then replace anything else.
const clean = (s: string) =>
  s
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[  -   　]/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\n\x20-\x7E¡-ÿ]/g, '?')

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const lines: string[] = []
  for (const para of clean(text).split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) <= maxW) {
        line = test
        continue
      }
      if (line) lines.push(line)
      let w = word
      while (font.widthOfTextAtSize(w, size) > maxW) {
        let cut = w.length - 1
        while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--
        lines.push(w.slice(0, cut))
        w = w.slice(cut)
      }
      line = w
    }
    lines.push(line)
  }
  return lines
}

export async function buildPdf(
  items: ExportRow[],
  check: Verify,
  heading = 'Incident record export',
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdf.embedFont(StandardFonts.Courier)

  const PW = 612
  const PH = 792
  const M = 50
  const W = PW - M * 2
  let page = pdf.addPage([PW, PH])
  let y = PH - M

  const need = (h: number) => {
    if (y - h < M) {
      page = pdf.addPage([PW, PH])
      y = PH - M
    }
  }
  const write = (text: string, f: PDFFont, size: number, indent = 0, gray = 0.1) => {
    for (const ln of wrap(text, f, size, W - indent)) {
      need(size + 4)
      if (ln !== '') {
        page.drawText(ln, { x: M + indent, y: y - size, size, font: f, color: rgb(gray, gray, gray) })
      }
      y -= size + 4
    }
  }
  const gap = (h: number) => {
    y -= h
  }

  write(heading, bold, 18)
  gap(4)
  write(`Created: ${fmtTime(new Date().toISOString())}`, font, 10, 0, 0.35)
  write(`Entries: ${items.length}`, font, 10, 0, 0.35)
  gap(6)
  write(
    check.ok
      ? `Integrity check at export: passed (${check.count} entries)`
      : `Integrity check at export: FAILED - ${check.problem ?? 'unknown problem'}`,
    bold,
    10,
  )
  for (const n of check.notices) write(`Notice: ${n}`, font, 9, 0, 0.35)
  const last = items[items.length - 1]
  if (last) write(`Final chain hash: ${last.entryHash}`, mono, 7.5, 0, 0.35)
  gap(6)
  write(
    'Notes: Times come from the phone clock and were not independently verified. ' +
      'Hashes show whether entries changed after they were saved; they do not prove ' +
      'that an event happened or who made the entry. Admissibility depends on local law. ' +
      'Ask a lawyer or advocate how to use this record.',
    font,
    9,
    0,
    0.35,
  )
  gap(10)

  for (const it of items) {
    need(60)
    write(`#${it.seq}  ${it.kind.toUpperCase()}`, bold, 10)
    write(`Saved: ${fmtTime(it.createdAt, it.tz)}`, font, 9, 0, 0.3)
    if (it.happenedAt) write(`Happened (as entered): ${fmtTime(it.happenedAt, it.tz)}`, font, 9, 0, 0.3)
    if (it.capturedAt)
      write(
        `${it.capturedFrom === 'recording' ? 'Recorded' : 'File dated'}: ${fmtTime(it.capturedAt, it.tz)}`,
        font,
        9,
        0,
        0.3,
      )
    write(it.title, font, 11)
    if (it.text) write(it.text, font, 10, 12)
    if (it.fileName) {
      write(`File: ${it.fileName}${it.size ? ` (${fmtSize(it.size)})` : ''}`, font, 9, 12, 0.3)
      if (it.fileHash) write(`File SHA-256: ${it.fileHash}`, mono, 7.5, 12, 0.35)
    }
    write(`Entry hash: ${it.entryHash}`, mono, 7.5, 12, 0.35)
    gap(8)
  }
  return pdf.save()
}

export function downloadPdf(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportPdf() {
  const [items, check] = await Promise.all([listForExport(), verifyChain()])
  downloadPdf(await buildPdf(items, check), 'incident-record.pdf')
}
