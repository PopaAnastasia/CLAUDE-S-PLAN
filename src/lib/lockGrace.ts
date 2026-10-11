// Picking a file or opening the camera can send the app to the background.
// A short grace period stops that from locking the journal mid-task.
let until = 0
export const graceLock = (ms = 60_000) => {
  until = Date.now() + ms
}
export const inGrace = () => Date.now() < until

// While something is in progress (recording, saving, backup), never auto-lock.
let holds = 0
export const holdLock = () => {
  holds++
  let done = false
  return () => {
    if (!done) {
      done = true
      holds = Math.max(0, holds - 1)
    }
  }
}
export const isHeld = () => holds > 0
