import { normalizeSecret } from '../crypto/vault'

// The setup code is shared in person by advocates, support groups and lawyers.
// Typed into Help -> "Ask a question" on a phone with no journal yet, it opens
// the private setup screen. Once a journal exists it does nothing special, so
// it can never reveal that a journal is set up on this phone.
// Change it here if your partners need a different one.
export const SETUP_CODE = 'fresh start 26'

export const isSetupCode = (q: string) => normalizeSecret(q) === SETUP_CODE
