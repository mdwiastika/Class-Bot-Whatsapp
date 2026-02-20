import 'dotenv/config'
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} from '@whiskeysockets/baileys'
import P from 'pino'
import QRCode from 'qrcode'

import { routeMessage } from './bot/messageRouter.js'
import { buildContext } from './bot/contextBuilder.js'
import { startReminderScheduler } from "./services/reminderScheduler.js"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        browser: Browsers.ubuntu("Desktop"), // penting untuk pairing stabil
        markOnlineOnConnect: false
    })

    startReminderScheduler(sock)

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log(await QRCode.toString(qr, { type: 'terminal', small: true }))
        }

        if (connection === 'open') {
            console.log('Bot connected 🔥')
        }

        if (connection === 'close') {
            const shouldRestart =
                lastDisconnect?.error?.output?.statusCode ===
                DisconnectReason.restartRequired

            console.log('Connection closed.')

            if (shouldRestart) {
                console.log('Restart required. Reconnecting...')
                startBot()
            } else {
                console.log('Logged out or connection error.')
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const context = buildContext(sock, msg)
        await routeMessage(context)
    })
}

startBot()
