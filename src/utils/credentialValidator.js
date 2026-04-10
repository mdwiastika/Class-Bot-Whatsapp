/**
 * Credential validation helper
 * Prevents DRY violations by centralizing credential checks
 */

import { getUserCredentials } from '../repositories/userCredentialsRepository.js'

const CREDS_NOT_FOUND_MESSAGE = `
⚠️  *Belum Setup!*

Kamu harus setup credentials dulu:
/logbook setup email@pens.ac.id password

Setup sekarang, lalu coba lagi!
`

/**
 * Validate that user has stored credentials
 * @param {string} sender - User sender ID
 * @param {Function} reply - Reply function from context
 * @returns {Object|null} { creds, valid: true } or null if not found
 */
export async function validateUserCredentials(sender, reply) {
    const creds = await getUserCredentials(sender)

    if (!creds) {
        reply(CREDS_NOT_FOUND_MESSAGE)
        return null
    }

    return { creds, valid: true }
}

/**
 * Get credentials or send error reply
 */
export async function getCredentialsOrReply(sender, reply) {
    const result = await validateUserCredentials(sender, reply)
    return result?.creds
}
