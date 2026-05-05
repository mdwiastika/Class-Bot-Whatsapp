import { saveUserCredentials, getUserCredentials, deleteUserCredentials } from "../repositories/userCredentialsRepository.js"
import { getAvailableMatakuliah, loginAndSubmitLogbook, formatMatakuliahList } from "../services/pensLogbookService.js"
import { validateUserCredentials } from "../utils/credentialValidator.js"
import { isValidTimeRange } from "../utils/validation.js"

async function sendProgressMessage(context, text) {
    const sent = await context.sock.sendMessage(context.groupId, { text })
    return sent?.key || null
}

async function sendOrEditMessage(context, key, text) {
    if (!key) return context.reply(text)
    return context.sock.sendMessage(context.groupId, { text, edit: key })
}

async function handleLogbookSetup(context) {
    const { args, sender, groupId, reply } = context
    const [, email, password] = args

    if (!email || !password) {
        return reply(`❌ Format salah.\n\nGunakan:\n/logbook setup email@pens.ac.id password`)
    }

    try {
        await saveUserCredentials(sender, groupId, email, password)
        return reply(`✅ *Credentials berhasil disimpan*
──────────

📧 Email: ${email}
🔐 Password: disimpan aman

Lanjutkan dengan:
- /logbook matkul
- /logbook fill [ID] [jam_mulai] [jam_selesai] "kegiatan"
- /logbook delete`)
    } catch (error) {
        console.error("Setup error:", error)
        return reply(`❌ *Error!*\n\nGagal menyimpan credentials.\nCoba lagi atau hubungi admin.`)
    }
}

async function handleLogbookMatkul(context) {
    const { sender, reply } = context
    let progressKey = null

    try {
        const credsResult = await validateUserCredentials(sender, reply)
        if (!credsResult) return

        progressKey = await sendProgressMessage(
            context,
            "🔄 *Ambil daftar mata kuliah...*\n⏳ Login ke PENS...\n📚 Fetch matkul...\nTunggu sebentar..."
        )

        const { creds } = credsResult
        const result = await getAvailableMatakuliah(creds.email, creds.password)

        if (!result.success) {
            return sendOrEditMessage(
                context,
                progressKey,
                `❌ Gagal ambil mata kuliah.\n\n${result.message}\n\nCoba setup ulang:\n/logbook setup email password`
            )
        }

        return sendOrEditMessage(context, progressKey, formatMatakuliahList(result.data.matakuliah))
    } catch (error) {
        console.error("Matkul error:", error)
        return sendOrEditMessage(context, progressKey, `❌ Terjadi error saat ambil mata kuliah.\n\n${error.message}`)
    }
}

async function handleLogbookFill(context) {
    const { args, sender, reply } = context
    let progressKey = null

    try {
        const credsResult = await validateUserCredentials(sender, reply)
        if (!credsResult) return

        const [, matakuliahNumber, jamMulai, jamSelesai, ...kegiatanArray] = args
        const kegiatan = kegiatanArray.join(" ").replace(/"/g, '')

        if (!matakuliahNumber || !jamMulai || !jamSelesai || !kegiatan) {
            return reply(`❌ Format salah.

Gunakan:
/logbook fill NOMOR JAM_MULAI JAM_SELESAI "KEGIATAN"

Contoh:
/logbook fill 1 07:00 16:00 "Belajar chapter 5"`)
        }

        const timeValidation = isValidTimeRange(jamMulai, jamSelesai)
        if (!timeValidation.valid) {
            return reply(`❌ Format jam salah.\n\n${timeValidation.error}\n\nGunakan format HH:MM (24 jam).`)
        }

        progressKey = await sendProgressMessage(
            context,
            "🔄 Memproses logbook...\nLogin, validasi, dan submit sedang berjalan."
        )

        const { creds } = credsResult
        const matkResult = await getAvailableMatakuliah(creds.email, creds.password)
        if (!matkResult.success) {
            return sendOrEditMessage(context, progressKey, `❌ Gagal ambil mata kuliah.\n\n${matkResult.message}`)
        }

        const matakuliahIndex = parseInt(matakuliahNumber) - 1
        const matkList = matkResult.data.matakuliah
        if (isNaN(matakuliahIndex) || matakuliahIndex < 0 || matakuliahIndex >= matkList.length) {
            return sendOrEditMessage(context, progressKey, `❌ Nomor mata kuliah tidak valid.\n\n${formatMatakuliahList(matkList)}`)
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
            return sendOrEditMessage(context, progressKey, `✅ Logbook berhasil diisi.

📚 ${submitResult.data.matakuliah}
📅 ${submitResult.data.tanggal}
⏰ ${submitResult.data.jam_mulai} - ${submitResult.data.jam_selesai}`)
        }

        return sendOrEditMessage(context, progressKey, `❌ Gagal isi logbook.\n\n${submitResult.message}`)

    } catch (error) {
        console.error("Fill error:", error)
        return sendOrEditMessage(context, progressKey, `❌ Terjadi error saat isi logbook.\n\n${error.message}`)
    }
}

async function handleLogbookInfo(context) {
    const { sender, reply } = context

    try {
        const creds = await getUserCredentials(sender)
        if (!creds) {
            return reply("📭 Belum ada credentials.\n\nSetup dulu:\n/logbook setup email@pens.ac.id password")
        }

        const created = new Date(creds.created_at).toLocaleDateString('id-ID')
        return reply(`📋 *Info Credentials*
──────────

📧 Email: ${creds.email}
🔐 Password: disimpan aman
📅 Tanggal setup: ${created}

Perintah:
- /logbook matkul
- /logbook fill
- /logbook delete`)

    } catch (error) {
        console.error("Info error:", error)
        return reply("❌ Gagal mengambil info credentials.")
    }
}

async function handleLogbookDelete(context) {
    const { sender, reply } = context

    try {
        const creds = await getUserCredentials(sender)
        if (!creds) {
            return reply("📭 Belum ada credentials yang tersimpan.")
        }

        await deleteUserCredentials(sender)
        return reply("✅ Credentials berhasil dihapus.\n\nSetup lagi dengan:\n/logbook setup email password")

    } catch (error) {
        console.error("Delete error:", error)
        return reply("❌ Gagal menghapus credentials.")
    }
}

export async function handleLogbook(context) {
    const { args } = context

    if (!args.length) {
        return context.reply(`📚 *Perintah Logbook*
──────────

- /logbook setup email password
- /logbook matkul
- /logbook fill # jam_mulai jam_selesai "kegiatan"
- /logbook info
- /logbook delete`)
    }

    const action = args[0].toLowerCase()

    switch (action) {
        case "setup": return handleLogbookSetup(context)
        case "matkul": return handleLogbookMatkul(context)
        case "fill": return handleLogbookFill(context)
        case "info": return handleLogbookInfo(context)
        case "delete": return handleLogbookDelete(context)
        default: return context.reply(`❌ Perintah logbook tidak dikenal.

Gunakan:
- /logbook setup
- /logbook matkul
- /logbook fill
- /logbook info
- /logbook delete`)
    }
}
