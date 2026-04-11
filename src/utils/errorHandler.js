const ERROR_CATEGORIES = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    DATABASE: 'DATABASE_ERROR',
    NETWORK: 'NETWORK_ERROR',
    PENS_API: 'PENS_API_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
}

function categorizeError(error) {
    if (!error) return ERROR_CATEGORIES.UNKNOWN

    const message = error.message || ''
    const code = error.code || ''

    if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        return ERROR_CATEGORIES.NETWORK
    }

    if (code === '23505' || message.includes('unique constraint')) {
        return ERROR_CATEGORIES.DATABASE
    }

    if (error.statusCode === 401 || message.includes('Unauthorized')) {
        return ERROR_CATEGORIES.AUTH
    }

    if (error.statusCode === 422 || error.statusCode === 400 || message.includes('validation')) {
        return ERROR_CATEGORIES.VALIDATION
    }

    if (message.includes('PENS') || message.includes('CAS') || message.includes('logbook')) {
        return ERROR_CATEGORIES.PENS_API
    }

    return ERROR_CATEGORIES.UNKNOWN
}

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

function shouldRetry(category) {
    return [
        ERROR_CATEGORIES.NETWORK,
        ERROR_CATEGORIES.DATABASE,
        ERROR_CATEGORIES.PENS_API
    ].includes(category)
}

export async function handleErrorAndReply(error, context, actionName = 'operasi') {
    const category = categorizeError(error)
    const shouldRetryError = shouldRetry(category)
    const userMessage = getUserMessage(category, actionName)

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

    const finalMessage = shouldRetryError
        ? userMessage + `\n\n🔄 Sistem akan mencoba ulang...`
        : userMessage

    return context.reply(finalMessage)
}

function generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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
