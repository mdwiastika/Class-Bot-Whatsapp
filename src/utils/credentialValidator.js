import { getUserCredentials } from '../repositories/userCredentialsRepository.js'

const CREDS_NOT_FOUND_MESSAGE = `
⚠️  *Belum Setup!*

Kamu harus setup credentials dulu:
/logbook setup email@pens.ac.id password

Setup sekarang, lalu coba lagi!
`

export async function validateUserCredentials(sender, reply) {
    const creds = await getUserCredentials(sender)

    if (!creds) {
        reply(CREDS_NOT_FOUND_MESSAGE)
        return null
    }

    return { creds, valid: true }
}

export async function getCredentialsOrReply(sender, reply) {
    const result = await validateUserCredentials(sender, reply)
    return result?.creds
}
