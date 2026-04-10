import { saveUserCredentials, getUserCredentials, deleteUserCredentials } from "../repositories/userCredentialsRepository.js"
import { getAvailableMatakuliah, loginAndSubmitLogbook, formatMatakuliahList } from "../services/pensLogbookService.js"
import { validateUserCredentials } from "../utils/credentialValidator.js"
import { isValidTimeRange } from "../utils/validation.js"

// ============================================================================
// HANDLER: Setup credentials
// ============================================================================
async function handleLogbookSetup(context) {
    const { args, sender, groupId, reply } = context
    const [, email, password] = args

    if (!email || !password) {
        return reply(`❌ *Format Salah!*\n\nFormat: /logbook setup email@pens.ac.id password\n\n🔐 Password akan disimpan terenkripsi di database!`)
    }

    try {
        await saveUserCredentials(sender, groupId, email, password)
        return reply(`✅ *Credentials Berhasil Disimpan!*\n\n📧 Email: ${email}\n🔐 Password: ****(aman)\n\nSekarang kamu bisa:\n1️⃣ /logbook matkul\n2️⃣ /logbook fill [ID] [jam] [jam] "kegiatan"\n\nHapus: /logbook delete`)
    } catch (error) {
        console.error("Setup error:", error)
        return reply(`❌ *Error!*\n\nGagal menyimpan credentials.\nCoba lagi atau hubungi admin.`)
    }
}

// ============================================================================
// HANDLER: List available mata kuliah
// ============================================================================
async function handleLogbookMatkul(context) {
    const { sender, reply } = context

    try {
        const credsResult = await validateUserCredentials(sender, reply)
        if (!credsResult) return

        await reply(`🔄 *Ambil daftar mata kuliah...*\n⏳ Login ke PENS...\n📚 Fetch matkul...\nTunggu sebentar...`)

        const { creds } = credsResult
        const result = await getAvailableMatakuliah(creds.email, creds.password)

        if (!result.success) {
            return reply(`❌ *Gagal Ambil Mata Kuliah!*\n\n${result.message}\n\nSolusi: /logbook setup email password`)
        }

        return reply(formatMatakuliahList(result.data.matakuliah))
    } catch (error) {
        console.error("Matkul error:", error)
        return reply(`❌ *Error!*\n\n${error.message}\n\nGagal mengambil mata kuliah.`)
    }
}

// ============================================================================
// HANDLER: Fill logbook entry
// ============================================================================
async function handleLogbookFill(context) {
    const { args, sender, reply } = context

    try {
        const credsResult = await validateUserCredentials(sender, reply)
        if (!credsResult) return

        const [, matakuliahNumber, jamMulai, jamSelesai, ...kegiatanArray] = args
        const kegiatan = kegiatanArray.join(" ").replace(/"/g, '')

        if (!matakuliahNumber || !jamMulai || !jamSelesai || !kegiatan) {
            return reply(`❌ *Format Salah!*\n\n/logbook fill NOMOR JAM_MULAI JAM_SELESAI "KEGIATAN"\n\nContoh: /logbook fill 1 07:00 16:00 "Belajar chapter 5"`)
        }

        const timeValidation = isValidTimeRange(jamMulai, jamSelesai)
        if (!timeValidation.valid) {
            return reply(`❌ *Format Jam Salah!*\n\n${timeValidation.error}\n\nFormat: HH:MM (24-jam)`)
        }

        await reply(`🔄 *Isi Logbook...*\n⏳ Login...\n📝 Validasi...\n🚀 Submit...`)

        const { creds } = credsResult
        const matkResult = await getAvailableMatakuliah(creds.email, creds.password)
        if (!matkResult.success) {
            return reply(`❌ *Gagal Ambil Mata Kuliah!*\n\n${matkResult.message}`)
        }

        const matakuliahIndex = parseInt(matakuliahNumber) - 1
        const matkList = matkResult.data.matakuliah
        if (isNaN(matakuliahIndex) || matakuliahIndex < 0 || matakuliahIndex >= matkList.length) {
            return reply(`❌ *Nomor Tidak Valid!*\n\n${formatMatakuliahList(matkList)}`)
        }

        const selectedMatkul = matkList[matakuliahIndex]
        const submitResult = await loginAndSubmitLogbook(creds.email, creds.password, {
            matakuliah: selectedMatkul.value,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            kegiatan: kegiatan,
            sesuai_kuliah: "1"
        })

        if (submitResult.success) {
            return reply(`✅ *Logbook Berhasil Diisi!*\n\n📚 ${submitResult.data.matakuliah}\n📅 ${submitResult.data.tanggal}\n⏰ ${submitResult.data.jam_mulai} - ${submitResult.data.jam_selesai}`)
        }

        return reply(`❌ *Gagal Isi Logbook!*\n\n${submitResult.message}`)

    } catch (error) {
        console.error("Fill error:", error)
        return reply(`❌ *Error!*\n\n${error.message}\n\nGagal mengisi logbook.`)
    }
}

// ============================================================================
// HANDLER: Show stored credentials info
// ============================================================================
async function handleLogbookInfo(context) {
    const { sender, reply } = context

    try {
        const creds = await getUserCredentials(sender)
        if (!creds) {
            return reply(`📭 *Belum Ada Credentials*\n\nSetup: /logbook setup email@pens.ac.id password`)
        }

        const created = new Date(creds.created_at).toLocaleDateString('id-ID')
        return reply(`📋 *INFO CREDENTIALS*\n\n📧 Email: ${creds.email}\n🔐 Password: ****(aman)\n📅 Setup: ${created}\n\nPerintah:\n/logbook matkul\n/logbook fill\n/logbook delete`)

    } catch (error) {
        console.error("Info error:", error)
        return reply(`❌ *Error!*\n\nGagal mengambil info.`)
    }
}

// ============================================================================
// HANDLER: Delete stored credentials
// ============================================================================
async function handleLogbookDelete(context) {
    const { sender, reply } = context

    try {
        const creds = await getUserCredentials(sender)
        if (!creds) {
            return reply(`📭 *Belum Ada Credentials*\n\nTidak ada yang bisa dihapus.`)
        }

        await deleteUserCredentials(sender)
        return reply(`🗑️  *Credentials Dihapus* ✅\n\nSetup lagi: /logbook setup email password`)

    } catch (error) {
        console.error("Delete error:", error)
        return reply(`❌ *Error!*\n\nGagal menghapus credentials.`)
    }
}

// ============================================================================
// ACTION DISPATCHER
// ============================================================================
const actionHandlers = {
    setup: handleLogbookSetup,
    matkul: handleLogbookMatkul,
    'info-matkul': handleLogbookMatkul,
    'info-matkul-id': handleLogbookMatkul,
    fill: handleLogbookFill,
    info: handleLogbookInfo,
    delete: handleLogbookDelete,
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
export async function handleLogbook(context) {
    const { args, reply } = context

    if (!args.length) {
        return reply(`📖 *LOGBOOK COMMANDS*\n\n/logbook setup email password\n/logbook matkul\n/logbook fill NOMOR jam_mulai jam_selesai kegiatan\n/logbook info\n/logbook delete`)
    }

    const action = args[0].toLowerCase()
    const handler = actionHandlers[action]

    if (!handler) {
        return reply(`❌ *Action Tidak Dikenal!*\n\n/logbook setup email password\n/logbook matkul\n/logbook fill NOMOR jam_mulai jam_selesai kegiatan\n/logbook info\n/logbook delete`)
    }

    return handler(context)
}
