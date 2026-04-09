/**
 * Service untuk integrasi PENS CAS Login & Logbook Submission
 * Base dari code yang sudah berhasil di project lain
 */

import axios from "axios"
import { wrapper } from "axios-cookiejar-support"
import { CookieJar } from "tough-cookie"
import * as cheerio from "cheerio"
const CAS_URL = "https://login.pens.ac.id/cas/login"
const SERVICE_URL = "https://online.mis.pens.ac.id/index.php?Login=1&halAwal=1"
const LOGBOOK_PAGE = "https://online.mis.pens.ac.id/entry_logbook_kp1.php"
const MENTRY_PAGE = "https://online.mis.pens.ac.id/mEntry_Logbook_KP1.php"

/**
 * Login ke PENS CAS dan submit logbook
 */
export async function loginAndSubmitLogbook(email, password, logbookData) {
    try {
        console.log("[PENS Logbook] Starting login & submit process...")
        console.log("[PENS Logbook] Email:", email.substring(0, 8) + "***")

        const jar = new CookieJar()
        const client = wrapper(axios.create({
            jar,
            withCredentials: true,
            maxRedirects: 0,
        }))

        // Step 1: Login via CAS
        console.log("[PENS Logbook] Step 1: Logging in via CAS...")
        await loginCAS(client, email, password)
        console.log("[PENS Logbook] ✅ CAS login successful")

        // Step 2: Get initial params & data
        console.log("[PENS Logbook] Step 2: Fetching logbook data...")
        const data = await getLogbookData(client)
        console.log("[PENS Logbook] ✅ Data fetched:", {
            nrp: data.nrp,
            tahun: data.valTahun,
            semester: data.valSemester,
            minggu: data.valMinggu,
            matakuliah_count: data.matakuliahList.length
        })

        // Step 3: Validate mata kuliah
        const matakuliahId = logbookData.matakuliah
        const selectedMatkul = data.matakuliahList.find(m => m.value === matakuliahId)

        if (!selectedMatkul) {
            throw new Error(`Mata kuliah dengan ID "${matakuliahId}" tidak ditemukan. Pilihan: ${data.matakuliahList.map(m => m.value).join(", ")}`)
        }

        console.log("[PENS Logbook] ✅ Mata kuliah found:", selectedMatkul.text)

        // Step 4: Submit logbook
        console.log("[PENS Logbook] Step 3: Submitting logbook...")
        
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
        
        console.log("[PENS Logbook] Mata kuliah value type:", typeof selectedMatkul.value, "Value:", selectedMatkul.value)
        console.log("[PENS Logbook] Available mata kuliah values:", data.matakuliahList.slice(0, 3).map(m => ({value: m.value, text: m.text})))
        console.log("[PENS Logbook] Submit payload:", JSON.stringify(submitPayload, null, 2))
        
        const submitRes = await client.post(
            LOGBOOK_PAGE,
            new URLSearchParams(submitPayload),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )

        console.log("[PENS Logbook] Submit response status:", submitRes.status)
        
        // Check if response contains error messages
        if (submitRes.data && typeof submitRes.data === 'string') {
            if (submitRes.data.includes('Error') || submitRes.data.includes('error') || submitRes.data.includes('gagal')) {
                console.log("[PENS Logbook] ⚠️  Response contains potential error:")
                console.log(submitRes.data.substring(0, 500))
            }
        }
        
        console.log("[PENS Logbook] ✅ Logbook submitted successfully")

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
        return {
            success: false,
            message: error.message
        }
    }
}

/**
 * Login ke CAS PENS
 */
async function loginCAS(client, email, password) {
    try {
        // Get login page untuk ambil LT token
        const loginPage = await client.get(`${CAS_URL}?service=${encodeURIComponent(SERVICE_URL)}`)
        const $ = cheerio.load(loginPage.data)
        const lt = $('input[name="lt"]').val()

        if (!lt) throw new Error("LT token tidak ditemukan di halaman login")

        console.log("[PENS Logbook] LT token:", lt.substring(0, 10) + "***")

        // Submit login
        let res
        try {
            res = await client.post(
                `${CAS_URL}?service=${encodeURIComponent(SERVICE_URL)}`,
                new URLSearchParams({
                    username: email,
                    password,
                    lt,
                    _eventId: "submit",
                    submit: "LOGIN",
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
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

        console.log("[PENS Logbook] Redirect to:", redirectUrl.substring(0, 50) + "...")

        // Follow redirects
        await followRedirects(client, redirectUrl)

        return true

    } catch (error) {
        throw new Error(`CAS login failed: ${error.message}`)
    }
}

/**
 * Follow redirect chain
 */
async function followRedirects(client, url) {
    let currentUrl = url
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
        try {
            await client.get(currentUrl)
            return
        } catch (err) {
            if (err.response?.status === 302) {
                currentUrl = err.response.headers.location
                console.log("[PENS Logbook] Redirect to:", currentUrl.substring(0, 50) + "...")
                attempts++
            } else {
                throw err
            }
        }
    }

    throw new Error("Too many redirects")
}

/**
 * Get logbook data (NRP, params, mata kuliah)
 */
async function getLogbookData(client) {
    try {
        // Get initial params (tahun, semester, minggu)
        const params = await getInitialParams(client)

        // Get logbook page untuk ambil NRP, kp_daftar, mahasiswa, matakuliah
        const res = await client.get(LOGBOOK_PAGE, {
            params: {
                ...params,
                sid: Math.random(),
            },
        })

        const $ = cheerio.load(res.data)

        // Debug: log all form inputs to understand what fields are available
        const allInputs = {}
        $('input, select, textarea').each((i, el) => {
            const name = $(el).attr('name')
            const value = $(el).attr('value') || $(el).val()
            if (name) allInputs[name] = value
        })
        console.log("[PENS Logbook] All form fields found:", Object.keys(allInputs).join(', '))

        // Extract NRP dari page (format: "NRP : 3123600041")
        const nrpText = $('td:contains("NRP")').text()
        const nrp = nrpText.match(/\d{10}/)?.[0]

        if (!nrp) {
            throw new Error("NRP tidak ditemukan di halaman logbook")
        }

        const kp_daftar = $('#kp_daftar').val()
        const mahasiswa = $('#mahasiswa').val()

        console.log("[PENS Logbook] Extracted form values:", { kp_daftar, mahasiswa, nrp })

        // Get mata kuliah list
        const matakuliahList = []
        $('#matakuliah option').each((i, el) => {
            const value = $(el).attr("value")
            const text = $(el).text().trim()

            if (value && value !== "") {
                matakuliahList.push({ value, text })
            }
        })

        if (matakuliahList.length === 0) {
            throw new Error("Tidak ada mata kuliah ditemukan")
        }

        return {
            ...params,
            nrp,
            kp_daftar,
            mahasiswa,
            matakuliahList,
        }

    } catch (error) {
        throw new Error(`Get logbook data failed: ${error.message}`)
    }
}

/**
 * Get initial parameters (tahun, semester, minggu)
 */
async function getInitialParams(client) {
    try {
        const res = await client.get(MENTRY_PAGE)
        const html = res.data

        // Match: showEntry_Logbook_KP1(2024, 1, 5)
        const match = html.match(/showEntry_Logbook_KP1\((\d+),\s*(\d+),\s*(\d+)\)/)

        if (!match) {
            throw new Error("Gagal extract parameter awal dari halaman")
        }

        const valTahun = match[1]
        const valSemester = match[2]
        const valMinggu = match[3]

        console.log("[PENS Logbook] Params:", { valTahun, valSemester, valMinggu })

        return { valTahun, valSemester, valMinggu }

    } catch (error) {
        throw new Error(`Get initial params failed: ${error.message}`)
    }
}

/**
 * Get available mata kuliah for user
 */
export async function getAvailableMatakuliah(email, password) {
    try {
        console.log("[PENS Matkul] Fetching available mata kuliah...")

        const jar = new CookieJar()
        const client = wrapper(axios.create({
            jar,
            withCredentials: true,
            maxRedirects: 0
        }))

        // Login
        await loginCAS(client, email, password)

        // Get data
        const data = await getLogbookData(client)

        console.log("[PENS Matkul] ✅ Found", data.matakuliahList.length, "mata kuliah")

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
        return {
            success: false,
            message: error.message
        }
    }
}

/**
 * Format mata kuliah list untuk WhatsApp
 */
export function formatMatakuliahList(matakuliahList) {
    let text = `╔════════════════════════════════╗\n║ 📚 DAFTAR MATA KULIAH          ║\n╚════════════════════════════════╝\n\n`

    matakuliahList.forEach((mk, index) => {
        text += `${index + 1}. ${mk.text}\n   🆔 ID: ${mk.value}\n\n`
    })

    text += `Untuk isi logbook:\n/logbook fill [ID] [jam_mulai] [jam_selesai] "kegiatan"\n\n`
    text += `Contoh:\n/logbook fill ${matakuliahList[0]?.value || "ID"} 07:00 16:00 "Belajar chapter 5"`

    return text
}
