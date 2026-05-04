/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sleep for a random duration between min and max milliseconds
 * @param {number} min - Minimum milliseconds to sleep
 * @param {number} max - Maximum milliseconds to sleep
 * @returns {Promise<void>}
 */
export function randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min
    return sleep(delay)
}
