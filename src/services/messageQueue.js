import { MESSAGE_DELAYS } from "../config/delays.js"
import { sleep, randomDelay } from "../utils/helpers.js"

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
        const index = Math.min(this.retries, MESSAGE_DELAYS.RETRY_BACKOFF.length - 1)
        return MESSAGE_DELAYS.RETRY_BACKOFF[index]
    }
}

class MessageQueueManager {
    constructor() {
        this.items = []
        this._isProcessing = false
    }

    enqueue(item) {
        this.items.push(item)
    }

    peekNext() {
        return this.items[0] || null
    }

    dequeueNext() {
        return this.items.shift()
    }

    isProcessing() {
        return this._isProcessing
    }

    setProcessing(value) {
        this._isProcessing = value
    }

    size() {
        return this.items.length
    }

    clear() {
        this.items = []
        this._isProcessing = false
    }
}

const queueManager = new MessageQueueManager()

async function processQueue(sock, manager) {
    if (manager.isProcessing()) return
    manager.setProcessing(true)

    try {
        while (manager.size() > 0) {
            const item = manager.peekNext()
            if (!item) break

            try {
                await sock.sendPresenceUpdate("composing", item.jid)
                await randomDelay(MESSAGE_DELAYS.TYPING_INDICATOR_MIN, MESSAGE_DELAYS.TYPING_INDICATOR_MAX)
                await sock.sendMessage(item.jid, item.message)
                await sock.sendPresenceUpdate("paused", item.jid)

                manager.dequeueNext()

                await randomDelay(MESSAGE_DELAYS.MESSAGE_INTERVAL_MIN, MESSAGE_DELAYS.MESSAGE_INTERVAL_MAX)
            } catch (err) {
                if (item.canRetry()) {
                    item.retries++
                    const delay = item.getRetryDelay()
                    console.warn(`⚠️ Retry ${item.retries}/${MESSAGE_DELAYS.MAX_RETRIES} in ${delay}ms`)
                    await sleep(delay)
                } else {
                    manager.dequeueNext()
                    console.error(`❌ Message failed permanently:`, {
                        jid: item.jid,
                        error: err.message,
                        createdAt: new Date(item.createdAt).toISOString()
                    })
                }
            }
        }
    } finally {
        manager.setProcessing(false)
    }
}

export async function enqueueMessage(sock, jid, message) {
    const item = new QueueItem(jid, message)
    queueManager.enqueue(item)
    return processQueue(sock, queueManager)
}

export { QueueItem, MessageQueueManager, queueManager }
