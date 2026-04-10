/**
 * Message sending delays configuration
 * These values prevent WhatsApp rate limiting and look natural
 * 
 * Configurable via environment variables for different environments
 */

export const MESSAGE_DELAYS = {
    // Typing indicator delay (800-1500ms)
    // This simulates the "typing" indicator seen in WhatsApp
    // Ref: Baileys library message sending patterns
    TYPING_INDICATOR_MIN: process.env.MESSAGE_TYPING_MIN ? parseInt(process.env.MESSAGE_TYPING_MIN) : 800,
    TYPING_INDICATOR_MAX: process.env.MESSAGE_TYPING_MAX ? parseInt(process.env.MESSAGE_TYPING_MAX) : 1500,

    // Between message wait (2-4 seconds)
    // Prevents WhatsApp from flagging as bot/spam
    // Ref: Observed WhatsApp Web rate limits in testing
    MESSAGE_INTERVAL_MIN: process.env.MESSAGE_INTERVAL_MIN ? parseInt(process.env.MESSAGE_INTERVAL_MIN) : 2000,
    MESSAGE_INTERVAL_MAX: process.env.MESSAGE_INTERVAL_MAX ? parseInt(process.env.MESSAGE_INTERVAL_MAX) : 4000,

    // Retry configuration
    // Exponential backoff delays for failed messages
    RETRY_BACKOFF: [1000, 3000, 10000],  // [1s, 3s, 10s]
    MAX_RETRIES: process.env.MESSAGE_MAX_RETRIES ? parseInt(process.env.MESSAGE_MAX_RETRIES) : 3,
}

/**
 * Get random delay within specified range
 */
export function getRandomDelay(min, max) {
    return Math.random() * (max - min) + min
}
