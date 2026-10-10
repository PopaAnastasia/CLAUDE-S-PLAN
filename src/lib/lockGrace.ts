// On phones, opening the camera or file picker hides the page, which would
// auto-lock the vault and lose the upload. This pauses auto-lock briefly.
let until = 0
export const graceLock = (ms = 60_000) => {
  until = Date.now() + ms
}
export const inGrace = () => Date.now() < until