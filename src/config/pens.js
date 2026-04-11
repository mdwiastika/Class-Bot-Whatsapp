/**
 * PENS Logbook Service Configuration
 * All URLs and endpoints centralized and configurable via environment
 */

export const PENS_CONFIG = {
    WORKER_URL: process.env.PENS_WORKER_URL || 'https://steep-wind-5100.marceldwias.workers.dev',
    CAS_HOST: process.env.PENS_CAS_HOST || 'login.pens.ac.id',
    MIS_HOST: process.env.PENS_MIS_HOST || 'online.mis.pens.ac.id',
    get SERVICE_URL() {
        return `https://${this.MIS_HOST}/index.php?Login=1&halAwal=1`
    },

    get CAS_LOGIN_URL() {
        return `${this.WORKER_URL}/cas/login`
    },

    get LOGBOOK_PAGE_URL() {
        return `${this.WORKER_URL}/entry_logbook_kp1.php`
    },

    get MENTRY_PAGE_URL() {
        return `${this.WORKER_URL}/mEntry_Logbook_KP1.php`
    },
}

export function validatePensConfig() {
    const required = ['WORKER_URL', 'CAS_HOST', 'MIS_HOST']
    const missing = required.filter(key => !PENS_CONFIG[key])

    if (missing.length > 0) {
        throw new Error(`Missing PENS configuration: ${missing.join(', ')}`)
    }

    return true
}
