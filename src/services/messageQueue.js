import { MESSAGE_DELAYS } from '../config/delays.js'

/**
 * Queue item with retry capability
 */
class QueueItem {
    constructor(jid, message) {
        this.jid = jid
        this.message = message
        this.retries = 0
        this.createdAt = Date.now()
    }

    canRetry() {
        return this.retries < MESSAGE_DELAYS.MAX_RETRIES
    }

    getRetryDelay() {
        if (this.retries >= MESSAGE_DELAYS.RETRY_BACKOFF.length) {
            return MESSAGE_DELAYS.RETRY_BACKOFF[MESSAGE_DELAYS.RETRY_BACKOFF.length - 1]
        }
        return MESSAGE_DELAYS.RETRY_BACKOFF[this.retries]
    }
}

let queue = []
let isProcessing = false

/**
 * Get random delay within range (in milliseconds)
 */
function randomDelay(min, max) {
    return new Promise(resolve => {
        const ms = Math.floor(Math.random() * (max - min)) + min
        setTimeout(resolve, ms)
    })
}

/**
 * Wait for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Process message queue with retry logic
 * Messages are only removed from queue after successful send
 */
async function processQueue(sock) {
    if (isProcessing) return
    isProcessing = true

    while (queue.length > 0) {
        const item = queue[0]  // Don't remove yet

        try {
            await sock.sendPresenceUpdate("composing", item.jid)
            await randomDelay(
                MESSAGE_DELAYS.TYPING_INDICATOR_MIN,
                MESSAGE_DELAYS.TYPING_INDICATOR_MAX
            )
            await sock.sendMessage(item.jid, item.message)
            await sock.sendPresenceUpdate("paused", item.jid)

            // ✅ Message sent successfully - remove from queue
            queue.shift()
            console.log(`✅ Message sent to ${item.jid}`)

            // Wait before next message
            await randomDelay(
                MESSAGE_DELAYS.MESSAGE_INTERVAL_MIN,
                MESSAGE_DELAYS.MESSAGE_INTERVAL_MAX
            )
        } catch (err) {
            if (item.canRetry()) {
                item.retries++
                const delay = item.getRetryDelay()
                console.warn(
                    `⚠️  Message failed to ${item.jid}, retry ${item.retries}/${MESSAGE_DELAYS.MAX_RETRIES} in ${delay}ms`
                )
                await sleep(delay)
                // Don't remove from queue, will retry on next iteration
            } else {
                // ❌ Max retries exceeded
                console.error(
                    `❌ Message failed permanently after ${MESSAGE_DELAYS.MAX_RETRIES} retries:`,
                    {
                        jid: item.jid,
                        message: typeof item.message === 'string' 
                            ? item.message.substring(0, 100) 
                            : JSON.stringify(item.message).substring(0, 100),
                        error: err.message,
                        createdAt: new Date(item.createdAt).toISOString()
                    }
                )
                queue.shift()  // Give up and remove from queue
                // TODO: Optionally store failed messages in database for debugging
            }
        }
    }

    isProcessing = false
}

/**
 * Enqueue a message for sending
 * Messages will be sent with delays to avoid WhatsApp rate limiting
 * @param {Object} sock - Socket.io-like connection
 * @param {string} jid - WhatsApp JID (recipient)
 * @param {Object} message - Message object
 */
export async function enqueueMessage(sock, jid, message) {
    const item = new QueueItem(jid, message)
    queue.push(item)
    processQueue(sock)
}
