import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { listForExport, verifyChain } from '../storage/evidence'

export const fmtSize = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`

// pdf-lib's built-in fonts only support Latin-1, so replace anything else.
const clean = (s: string) =>
  s
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[^\n\x20-\x7E\u00A0-\u00FF]/g, '?')

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

async function buildPdf(): Promise<Uint8Array> {
  const [items, check] = await Promise.all([listForExport(), verifyChain()])
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
        page.drawText(ln, {
          x: M + indent,
          y: y - size,
          size,
          font: f,
          color: rgb(gray, gray, gray),
        })
      }
      y -= size + 4
    }
  }
  const gap = (h: number) => {
    y -= h
  }

  write('Incident record export', bold, 18)
  gap(4)
  write(`Created: ${new Date().toLocaleString()}`, font, 10, 0, 0.35)
  write(`Entries: ${items.length}`, font, 10, 0, 0.35)
  gap(6)
  write(
    check.ok
      ? `Integrity check at export: passed (${check.count} entries)`
      : `Integrity check at export: FAILED - ${check.problem ?? 'unknown problem'}`,
    bold,
    10,
  )
  const last = items[items.length - 1]
  if (last) write(`Final chain hash: ${last.entryHash}`, mono, 7.5, 0, 0.35)
  gap(6)
  write(
    'Notes: Dates come from the device clock and were not independently verified. ' +
      'Hashes show whether entries changed after they were saved; they do not prove ' +
      'that an event happened. Admissibility depends on local law. Ask a lawyer or ' +
      'advocate how to use this record.',
    font,
    9,
    0,
    0.35,
  )
  gap(10)

  for (const it of items) {
    need(40)
    write(`#${it.seq}  ${it.kind.toUpperCase()}  ${new Date(it.createdAt).toLocaleString()}`, bold, 10)
    write(it.title, font, 11)
    if (it.text) write(it.text, font, 10, 8, 0.2)
    if (it.fileName) {
      const size = it.size ? ` (${fmtSize(it.size)})` : ''
      const mime = it.mime ? `, ${it.mime}` : ''
      write(`File: ${it.fileName}${size}${mime}`, font, 9, 0, 0.35)
    }
    if (it.fileHash) write(`File SHA-256: ${it.fileHash}`, mono, 7, 0, 0.35)
    write(`Entry hash: ${it.entryHash}`, mono, 7, 0, 0.35)
    gap(10)
  }
  return pdf.save()
}

export async function downloadPdf() {
  const bytes = await buildPdf()
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}