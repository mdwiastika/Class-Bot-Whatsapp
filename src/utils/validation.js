const PATTERNS = {
    TIME_HH_MM: /^\d{2}:\d{2}$/,
    WHATSAPP_JID: /^\d+@[cs]\.us$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

export function isValidTimeFormat(time) {
    return PATTERNS.TIME_HH_MM.test(time)
}

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

export function isValidJID(jid) {
    if (!jid || typeof jid !== 'string') return false
    return PATTERNS.WHATSAPP_JID.test(jid)
}

export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false
    return PATTERNS.EMAIL.test(email)
}

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

export function sanitizeForDisplay(input) {
    if (!input || typeof input !== 'string') return ''
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

export function isValidPositiveInteger(value) {
    const num = Number(value)
    return Number.isInteger(num) && num > 0
}

export function isInRange(value, min, max) {
    const num = Number(value)
    return Number.isFinite(num) && num >= min && num <= max
}

export const VALIDATION_PATTERNS = PATTERNS
