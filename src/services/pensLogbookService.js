import axios from "axios"
import { wrapper } from "axios-cookiejar-support"
import { CookieJar } from "tough-cookie"
import * as cheerio from "cheerio"
import { PENS_CONFIG } from "../config/pens.js"
import { hasBlockedSqlKeyword } from "../utils/validation.js"

const MATKUL_CACHE_TTL_MS = 30 * 60 * 1000
const SESSION_TTL_MS = 30 * 60 * 1000
const RETRY_BACKOFF_MS = [1000, 2500, 5000]
const MAX_RETRIES = RETRY_BACKOFF_MS.length
const matakuliahCache = new Map()

// Session cache per email to reuse CookieJar and avoid re-login when possible
const sessionStore = new Map()

function getSessionKey(email) {
    return String(email || "").toLowerCase().trim()
}

function getSession(email) {
    const key = getSessionKey(email)
    const entry = sessionStore.get(key)
    if (!entry) return null

    const expired =
        Date.now() - entry.updatedAt > SESSION_TTL_MS

    if (expired) {
        sessionStore.delete(key)
        return null
    }

    return entry
}

function setSession(email, jar) {
    const key = getSessionKey(email)
    sessionStore.set(key, { jar, updatedAt: Date.now() })
}
function clearSession(email) {
    const key = getSessionKey(email)
    sessionStore.delete(key)
}

export function getSessionJar(email) {
    const s = getSession(email)
    return s ? s.jar : null
}

function createClient(jar, targetHost) {
    return wrapper(axios.create({
        jar,
        withCredentials: true,
        maxRedirects: 0,
        headers: {
            "X-Proxy-Target": targetHost,
        }
    }))
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
}

export async function loginAndSubmitLogbook(email, password, logbookData, options = {}) {
    try {
        if (hasBlockedSqlKeyword(logbookData.kegiatan)) {
            throw new Error("HINDARI KATA-KATA SELECT, INSERT, UPDATE, DAN DELETE KARENA MEMUNGKINKAN DATA LOGBOOK TIDAK TERSIMPAN.")
        }

        let jar = options.jar || null
        let misClient

        if (jar) {
            // try using provided session jar first
            try {
                misClient = createClient(jar, PENS_CONFIG.MIS_HOST)
                // quick check; retry a couple times for transient failures
                let ok = false
                for (let i = 0; i < MAX_RETRIES; i++) {
                    try {
                        await getLogbookData(misClient)
                        ok = true
                        break
                    } catch (err) {
                        // transient — wait then retry
                        if (i < MAX_RETRIES - 1) await sleep(RETRY_BACKOFF_MS[i])
                    }
                }
                if (!ok) throw new Error('Session check failed')
            } catch (err) {
                clearSession(email)
                jar = null
            }
        }

        if (!jar) {
            jar = new CookieJar()
            // retry login a few times for transient errors
            let logged = false
            for (let i = 0; i < MAX_RETRIES; i++) {
                try {
                    await loginCAS(jar, email, password)
                    logged = true
                    break
                } catch (err) {
                    if (i < MAX_RETRIES - 1) await sleep(RETRY_BACKOFF_MS[i])
                }
            }
            if (!logged) throw new Error('CAS login failed after retries')
        }

        misClient = createClient(jar, PENS_CONFIG.MIS_HOST)
        const data = await getLogbookData(misClient)

        const matakuliahId = logbookData.matakuliah
        const selectedMatkul = data.matakuliahList.find(m => m.value === matakuliahId)
        if (!selectedMatkul) throw new Error(`Mata kuliah dengan ID "${matakuliahId}" tidak ditemukan`)

        const submitPayload = {
            valnrpMahasiswa: data.nrp,
            valTahun: data.valTahun,
            valSemester: data.valSemester,
            Simpan: "1",
            valMinggu: data.valMinggu,
            tanggal: logbookData.tanggal || new Date().toISOString().split("T")[0],
            jam_mulai: logbookData.jam_mulai,
            jam_selesai: logbookData.jam_selesai,
            kegiatan: logbookData.kegiatan,
            sesuai_kuliah: logbookData.sesuai_kuliah || "1",
            matakuliah: selectedMatkul.value,
            kp_daftar: data.kp_daftar,
            mahasiswa: data.mahasiswa,
            Setuju: "1",
            sid: Math.random().toString(),
        }

        await misClient.post(
            PENS_CONFIG.LOGBOOK_PAGE_URL,
            new URLSearchParams(submitPayload),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )

        return {
            success: true,
            message: "Logbook berhasil disubmit",
            data: {
                matakuliah: selectedMatkul.text,
                tanggal: logbookData.tanggal || new Date().toISOString().split("T")[0],
                jam_mulai: logbookData.jam_mulai,
                jam_selesai: logbookData.jam_selesai,
                kegiatan: logbookData.kegiatan,
                sesuai_kuliah: logbookData.sesuai_kuliah || "1"
            }
        }

    } catch (error) {
        console.error("[PENS Logbook] ❌ Error:", error.message)
        return { success: false, message: error.message }
    }
}

async function loginCAS(jar, email, password) {
    try {
        const casClient = createClient(jar, PENS_CONFIG.CAS_HOST)

        // Get LT token
        const loginPage = await casClient.get(
            `${PENS_CONFIG.CAS_LOGIN_URL}?service=${encodeURIComponent(PENS_CONFIG.SERVICE_URL)}`
        )
        const $ = cheerio.load(loginPage.data)
        const lt = $('input[name="lt"]').val()
        if (!lt) throw new Error("LT token tidak ditemukan")

        // Submit login
        let res
        try {
            res = await casClient.post(
                `${PENS_CONFIG.CAS_LOGIN_URL}?service=${encodeURIComponent(PENS_CONFIG.SERVICE_URL)}`,
                new URLSearchParams({
                    username: email,
                    password,
                    lt,
                    _eventId: "submit",
                    submit: "LOGIN",
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            )
        } catch (err) {
            // Some environments throw on redirect; capture response if present
            if (err.response?.status === 302) {
                res = err.response
            } else {
                const status = err.response?.status || err.code || ''
                const msg = err.message || ''
                throw new Error(`CAS login failed: ${status} ${msg}`)
            }
        }

        const redirectUrl = res.headers.location
        if (!redirectUrl) throw new Error("Redirect URL tidak ditemukan setelah login")

        await followRedirects(jar, redirectUrl)
        return true

    } catch (error) {
        throw new Error(`CAS login failed: ${error.message}`)
    }
}

async function followRedirects(jar, url) {
    let currentUrl = url
    let attempts = 0

    while (attempts < 10) {
        try {
            const parsed = new URL(currentUrl)
            const targetHost = parsed.host
            const workerUrl = `${PENS_CONFIG.WORKER_URL}${parsed.pathname}${parsed.search}`
            const client = createClient(jar, targetHost)
            await client.get(workerUrl)
            return
        } catch (err) {
            if (err.response?.status === 302) {
                currentUrl = err.response.headers.location
                attempts++
            } else {
                throw err
            }
        }
    }
    throw new Error("Too many redirects")
}

async function getLogbookData(misClient) {
    try {
        const params = await getInitialParams(misClient)

        const res = await misClient.get(PENS_CONFIG.LOGBOOK_PAGE_URL, {
            params: { ...params, sid: Math.random() }
        })

        const $ = cheerio.load(res.data)
        const nrpText = $('td:contains("NRP")').text()
        const nrp = nrpText.match(/\d{10}/)?.[0]
        if (!nrp) throw new Error("NRP tidak ditemukan")

        const kp_daftar = $('#kp_daftar').val()
        const mahasiswa = $('#mahasiswa').val()

        const matakuliahList = []
        $('#matakuliah option').each((i, el) => {
            const value = $(el).attr("value")
            const text = $(el).text().trim()
            if (value && value !== "") matakuliahList.push({ value, text })
        })

        if (matakuliahList.length === 0) throw new Error("Tidak ada mata kuliah ditemukan")

        return { ...params, nrp, kp_daftar, mahasiswa, matakuliahList }

    } catch (error) {
        throw new Error(`Get logbook data failed: ${error.message}`)
    }
}

async function getInitialParams(misClient) {
    try {
        const res = await misClient.get(PENS_CONFIG.MENTRY_PAGE_URL)
        const match = res.data.match(/showEntry_Logbook_KP1\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!match) throw new Error("Gagal extract parameter awal")

        return {
            valTahun: match[1],
            valSemester: match[2],
            valMinggu: match[3]
        }
    } catch (error) {
        throw new Error(`Get initial params failed: ${error.message}`)
    }
}

export async function getAvailableMatakuliah(email, password) {
    try {
        const jar = new CookieJar()
        await loginCAS(jar, email, password)

        const misClient = createClient(jar, PENS_CONFIG.MIS_HOST)
        const data = await getLogbookData(misClient)

        return {
            success: true,
            data: {
                matakuliah: data.matakuliahList,
                params: {
                    valTahun: data.valTahun,
                    valSemester: data.valSemester,
                    valMinggu: data.valMinggu
                },
                nrp: data.nrp
            }
        }
    } catch (error) {
        console.error("[PENS Matkul] ❌ Error:", error.message)
        return { success: false, message: error.message }
    }
}

function getMatkulCacheKey(email) {
    return String(email || "").toLowerCase().trim()
}

function getCachedMatakuliah(email) {
    const key = getMatkulCacheKey(email)
    if (!key || !matakuliahCache.has(key)) return null

    const cached = matakuliahCache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.cachedAt > MATKUL_CACHE_TTL_MS
    if (isExpired) {
        matakuliahCache.delete(key)
        return null
    }

    return cached.value
}

function setCachedMatakuliah(email, value) {
    const key = getMatkulCacheKey(email)
    if (!key || !value) return

    matakuliahCache.set(key, {
        value,
        cachedAt: Date.now()
    })
}

export function clearMatakuliahCache(email) {
    const key = getMatkulCacheKey(email)
    if (!key) return
    matakuliahCache.delete(key)
}

export async function getAvailableMatakuliahCached(email, password, options = {}) {
    const { forceRefresh = false } = options
    // If cached matakuliah available and not forcing refresh, return it immediately
    if (!forceRefresh) {
        const cached = getCachedMatakuliah(email)
        if (cached) {
            return {
                success: true,
                data: cached,
                cached: true
            }
        }
    }

    // Try to reuse existing session (CookieJar) to fetch matakuliah without re-login
    const existingSession = getSession(email)
    if (existingSession && !forceRefresh) {
        try {
            const misClient = createClient(existingSession.jar, PENS_CONFIG.MIS_HOST)
            const data = await getLogbookData(misClient)
            const payload = {
                matakuliah: data.matakuliahList,
                params: {
                    valTahun: data.valTahun,
                    valSemester: data.valSemester,
                    valMinggu: data.valMinggu
                },
                nrp: data.nrp
            }
            // update cache and return
            setCachedMatakuliah(email, payload)
            return { success: true, data: payload, cached: false }
        } catch (err) {
            // session probably expired or invalid, fallthrough to re-login
            console.warn(`[PENS Session] session reuse failed for ${email}: ${err.message}`)
            clearSession(email)
        }
    }

    // No usable session, perform full login and fetch
    try {
        const jar = new CookieJar()
        await loginCAS(jar, email, password)
        // store session for reuse
        setSession(email, jar)

        const misClient = createClient(jar, PENS_CONFIG.MIS_HOST)
        const data = await getLogbookData(misClient)

        const payload = {
            matakuliah: data.matakuliahList,
            params: {
                valTahun: data.valTahun,
                valSemester: data.valSemester,
                valMinggu: data.valMinggu
            },
            nrp: data.nrp
        }

        if (payload) setCachedMatakuliah(email, payload)

        return { success: true, data: payload, cached: false }
    } catch (error) {
        console.error("[PENS Matkul] ❌ Error:", error.message)
        return { success: false, message: error.message }
    }
}

export function formatMatakuliahList(matakuliahList) {
    // let text = `Isi logbook:\n/logbook fill [NOMOR] [jam_mulai] [jam_selesai] "kegiatan"\n\nContoh:\n/logbook fill 1 07:00 16:00 "Belajar chapter 5\n\n"`
    let text = "📚 *Daftar Mata Kuliah*\n──────────\n\n"
    matakuliahList.forEach((mk, index) => {
        text += `${index + 1}. ${mk.text}\n`
    })
    return text
}

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 menit

function cleanupSessions() {
    const now = Date.now()

    for (const [key, session] of sessionStore.entries()) {
        const expired =
            now - session.updatedAt > SESSION_TTL_MS

        if (expired) {
            sessionStore.delete(key)
        }
    }
}

function cleanupMatkulCache() {
    const now = Date.now()

    for (const [key, cache] of matakuliahCache.entries()) {
        const expired =
            now - cache.cachedAt > MATKUL_CACHE_TTL_MS

        if (expired) {
            matakuliahCache.delete(key)
        }
    }
}

setInterval(() => {
    cleanupSessions()
    cleanupMatkulCache()
}, CLEANUP_INTERVAL_MS)