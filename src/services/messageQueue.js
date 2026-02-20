let queue = []
let isProcessing = false

function randomDelay(min, max) {
    return new Promise(resolve => {
        const ms = Math.floor(Math.random() * (max - min)) + min
        setTimeout(resolve, ms)
    })
}

async function processQueue(sock) {
    if (isProcessing) return
    isProcessing = true

    while (queue.length > 0) {
        const { jid, message } = queue.shift()

        try {
            await sock.sendPresenceUpdate("composing", jid)
            await randomDelay(800, 1500)
            await sock.sendMessage(jid, message)
            await sock.sendPresenceUpdate("paused", jid)
            await randomDelay(2000, 4000)
        } catch (err) {
            console.error("Queue send error:", err)
        }
    }

    isProcessing = false
}

export async function enqueueMessage(sock, jid, message) {
    queue.push({ jid, message })
    processQueue(sock)
}