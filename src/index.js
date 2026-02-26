import 'dotenv/config'
import makeWASocket, {
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import { useDbAuthState } from './services/dbAuthState.js'
import P from 'pino'
import QRCode from 'qrcode'

import { routeMessage } from './bot/messageRouter.js'
import { buildContext } from './bot/contextBuilder.js'
import { startReminderScheduler } from "./services/reminderScheduler.js"
import { startGlobalScheduler } from './services/scheduler.js'

let schedulerStarted = false

async function startBot() {
    const { state, saveCreds } = await useDbAuthState()
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        auth: state,
        version,
        logger: P({ level: 'info' }),
        browser: Browsers.macOS("Desktop"),
        markOnlineOnConnect: true,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log(await QRCode.toString(qr, { type: "terminal", small: true }))
        }

        if (connection === "open") {
            console.log("Bot connected 🔥")

            if (!schedulerStarted) {
                startReminderScheduler(sock)
                startGlobalScheduler(sock)
                schedulerStarted = true
            }
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode

            if (statusCode === DisconnectReason.loggedOut) {
                console.log("Session logged out. Need QR.")
            } else {
                console.log("Connection closed:", statusCode)
            }

            // ❌ TIDAK ADA recursive startBot()
            // Biarkan systemd yang restart kalau process crash
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