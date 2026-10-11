// Shared styles for the private screens (setup, journal, shared record).
// Same palette as the fitness app, with a calm deep-green header so the
// journal feels like its own space without looking alarming.
export const shell = 'mx-auto min-h-screen max-w-md bg-[#f5f3ed] text-[#193c36]'
export const topbar =
  'sticky top-0 z-10 flex items-center justify-between bg-[#193c36] px-4 py-3 text-white shadow-md'
export const panel = 'rounded-2xl border border-[#e5e6df] bg-white p-4 shadow-sm'
export const input =
  'w-full rounded-xl border border-[#cdd2ce] bg-white px-3 py-2 text-sm text-[#193c36] outline-none placeholder:text-[#a3aaa7] focus:border-[#287354] focus:ring-2 focus:ring-[#d8e8db]'
export const btn = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
export const solid = `${btn} bg-[#287354] text-white hover:bg-[#1f5d44]`
export const soft = `${btn} border border-[#e5e6df] bg-white text-[#193c36] hover:bg-[#f5f3ed]`
export const heading = 'text-base font-bold text-[#193c36]'
export const muted = 'text-xs leading-relaxed text-[#687773]'
export const label = 'block text-xs font-semibold text-[#193c36]'
export const fileInput =
  'block w-full text-sm text-[#687773] file:mr-3 file:rounded-xl file:border-0 file:bg-[#d8e8db] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#287354]'

// Hides typed characters without using a password field, which would make
// the browser offer to "save password" and leave a visible trace.
export const masked = '[-webkit-text-security:disc]'
export const noAssist = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
} as const
