import axios from "axios"
import { wrapper } from "axios-cookiejar-support"
import { CookieJar } from "tough-cookie"
import * as cheerio from "cheerio"
import { PENS_CONFIG } from "../config/pens.js"
import { hasBlockedSqlKeyword } from "../utils/validation.js"

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

export async function loginAndSubmitLogbook(email, password, logbookData) {
    try {
        if (hasBlockedSqlKeyword(logbookData.kegiatan)) {
            throw new Error("HINDARI KATA-KATA SELECT, INSERT, UPDATE, DAN DELETE KARENA MEMUNGKINKAN DATA LOGBOOK TIDAK TERSIMPAN.")
        }

        const jar = new CookieJar()
        await loginCAS(jar, email, password)

        const misClient = createClient(jar, PENS_CONFIG.MIS_HOST)
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
            if (err.response?.status === 302) {
                res = err.response
            } else {
                throw err
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

export function formatMatakuliahList(matakuliahList) {
    let text = "📚 *Daftar Mata Kuliah*\n──────────\n\n"
    matakuliahList.forEach((mk, index) => {
        text += `${index + 1}. ${mk.text}\n`
    })
    text += `Isi logbook:\n/logbook fill [NOMOR] [jam_mulai] [jam_selesai] "kegiatan"\n\nContoh:\n/logbook fill 1 07:00 16:00 "Belajar chapter 5"`
    return text
}
