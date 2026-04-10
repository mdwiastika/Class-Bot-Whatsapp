/**
 * Centralized input validation utilities
 * DRY principle - single source of truth for all validation rules
 */

// Regex patterns - single source of truth
const PATTERNS = {
    TIME_HH_MM: /^\d{2}:\d{2}$/,
    WHATSAPP_JID: /^\d+@[cs]\.us$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

export function isValidTimeFormat(time) {
    return PATTERNS.TIME_HH_MM.test(time)
}

/**
 * Validate time range (start < end)
 */
export function isValidTimeRange(startTime, endTime) {
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        return { valid: false, error: 'Format jam harus HH:MM (24-jam)' }
    }

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startTotal = startHour * 60 + startMin
    const endTotal = endHour * 60 + endMin

    if (startTotal >= endTotal) {
        return { valid: false, error: 'Jam mulai harus lebih awal dari jam selesai' }
    }

    return { valid: true }
}

/**
 * Validate WhatsApp JID format
 */
export function isValidJID(jid) {
    if (!jid || typeof jid !== 'string') return false
    return PATTERNS.WHATSAPP_JID.test(jid)
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false
    return PATTERNS.EMAIL.test(email)
}

/**
 * Validate and trim text input
 */
export function validateAndTrimInput(input, maxLength = 500) {
    if (!input || typeof input !== 'string') {
        return { valid: false, error: 'Input tidak boleh kosong' }
    }

    const trimmed = input.trim()

    if (trimmed.length === 0) {
        return { valid: false, error: 'Input tidak boleh hanya spasi' }
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `Input terlalu panjang (max ${maxLength} karakter)` }
    }

    return { valid: true, value: trimmed }
}

/**
 * Sanitize input for display (basic HTML escaping)
 */
export function sanitizeForDisplay(input) {
    if (!input || typeof input !== 'string') return ''
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Validate positive integer (for IDs, counts, etc)
 */
export function isValidPositiveInteger(value) {
    const num = Number(value)
    return Number.isInteger(num) && num > 0
}

/**
 * Validate number is in range
 */
export function isInRange(value, min, max) {
    const num = Number(value)
    return Number.isFinite(num) && num >= min && num <= max
}

export const VALIDATION_PATTERNS = PATTERNS
