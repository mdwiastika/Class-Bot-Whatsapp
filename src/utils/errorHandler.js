/**
 * Centralized error handling and categorization
 * Converts raw errors into user-friendly messages and structured logs
 */

const ERROR_CATEGORIES = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    DATABASE: 'DATABASE_ERROR',
    NETWORK: 'NETWORK_ERROR',
    PENS_API: 'PENS_API_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * Categorize error based on type and message
 */
function categorizeError(error) {
    if (!error) return ERROR_CATEGORIES.UNKNOWN

    const message = error.message || ''
    const code = error.code || ''

    // Network errors
    if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        return ERROR_CATEGORIES.NETWORK
    }

    // Database errors
    if (code === '23505' || message.includes('unique constraint')) {
        return ERROR_CATEGORIES.DATABASE
    }

    // Authentication errors
    if (error.statusCode === 401 || message.includes('Unauthorized')) {
        return ERROR_CATEGORIES.AUTH
    }

    // Validation errors
    if (error.statusCode === 422 || error.statusCode === 400 || message.includes('validation')) {
        return ERROR_CATEGORIES.VALIDATION
    }

    // PENS API errors
    if (message.includes('PENS') || message.includes('CAS') || message.includes('logbook')) {
        return ERROR_CATEGORIES.PENS_API
    }

    return ERROR_CATEGORIES.UNKNOWN
}

/**
 * Get user-friendly message based on error category
 */
function getUserMessage(category, actionName = 'operation') {
    const baseMessage = `❌ *Error!*\n\nTerjadi kesalahan saat ${actionName}.`

    const messages = {
        [ERROR_CATEGORIES.VALIDATION]: baseMessage + `\n\n⚠️ Format atau data Anda tidak sesuai.\n\nSilakan cek kembali input.`,
        [ERROR_CATEGORIES.AUTH]: baseMessage + `\n\n⚠️ Email atau password salah.\n\nCoba /logbook setup email password`,
        [ERROR_CATEGORIES.DATABASE]: baseMessage + `\n\n⚠️ Data sudah ada di sistem atau database error.\n\nCoba lagi dalam beberapa saat.`,
        [ERROR_CATEGORIES.NETWORK]: baseMessage + `\n\n⚠️ Masalah koneksi dengan server.\n\n🔄 Coba lagi dalam beberapa detik.`,
        [ERROR_CATEGORIES.PENS_API]: baseMessage + `\n\n⚠️ Sistem PENS sedang bermasalah.\n\nCoba lagi nanti atau hubungi admin.`,
        [ERROR_CATEGORIES.UNKNOWN]: baseMessage + `\n\nGagal mengerjakan perintah.\n\nHubungi admin jika masalah berlanjut.`,
    }

    return messages[category] || messages[ERROR_CATEGORIES.UNKNOWN]
}

/**
 * Determine if error should be retried
 */
function shouldRetry(category) {
    return [
        ERROR_CATEGORIES.NETWORK,
        ERROR_CATEGORIES.DATABASE,
        ERROR_CATEGORIES.PENS_API
    ].includes(category)
}

/**
 * Handle error and send user-friendly reply
 * @param {Error} error - The error that occurred
 * @param {Object} context - Context with reply function
 * @param {string} actionName - Name of action for logging (e.g., 'menyimpan credentials')
 * @returns {boolean} Whether error was successfully handled
 */
export async function handleErrorAndReply(error, context, actionName = 'operasi') {
    const category = categorizeError(error)
    const shouldRetryError = shouldRetry(category)
    const userMessage = getUserMessage(category, actionName)

    // Log error with context
    console.error({
        errorId: generateErrorId(),
        category,
        action: actionName,
        user: context.sender,
        errorMessage: error.message,
        errorCode: error.code,
        shouldRetry: shouldRetryError,
        timestamp: new Date().toISOString()
    })

    // Add retry hint if applicable
    const finalMessage = shouldRetryError
        ? userMessage + `\n\n🔄 Sistem akan mencoba ulang...`
        : userMessage

    return context.reply(finalMessage)
}

/**
 * Generate unique error ID for user to report
 */
function generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error) {
    return {
        message: error?.message || 'Unknown error',
        code: error?.code,
        statusCode: error?.statusCode,
        stack: error?.stack,
        category: categorizeError(error)
    }
}

export {
    ERROR_CATEGORIES,
    categorizeError,
    getUserMessage,
    shouldRetry,
    generateErrorId
}
