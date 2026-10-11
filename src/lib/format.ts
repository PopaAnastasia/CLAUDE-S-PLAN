export const fmtSize = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`

// Shows the time in the zone it was recorded in, with the zone name.
export function fmtTime(iso: string, tz?: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'long',
      ...(tz ? { timeZone: tz } : {}),
    })
  } catch {
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'long' })
  }
}
