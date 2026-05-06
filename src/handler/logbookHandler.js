import { saveUserCredentials, getUserCredentials, deleteUserCredentials } from "../repositories/userCredentialsRepository.js"
import { getAvailableMatakuliah, getAvailableMatakuliahCached, loginAndSubmitLogbook, getSessionJar, formatMatakuliahList } from "../services/pensLogbookService.js"
import { validateUserCredentials } from "../utils/credentialValidator.js"
import { hasBlockedSqlKeyword, isValidTimeRange } from "../utils/validation.js"
import { setPendingAction, getPendingAction, clearPendingAction } from "../services/interactionService.js"

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

    // If email/password provided inline, save immediately
    if (email && password) {
        try {
            await saveUserCredentials(sender, groupId, email, password)
            return reply(`✅ *Credentials berhasil disimpan*\n──────────\n\n📧 Email: ${email}\n🔐 Password: disimpan aman\n\nLanjutkan dengan:\n- /logbook matkul\n- /logbook fill [ID] [jam_mulai] [jam_selesai] "kegiatan"\n- /logbook delete`)
        } catch (error) {
            console.error("Setup error:", error)
            return reply(`❌ *Error!*\n\nGagal menyimpan credentials.\nCoba lagi atau hubungi admin.`)
        }
    }

    // Start interactive setup flow if no credentials provided
    setPendingAction(sender, { action: "logbook_setup_wait_email", groupId })
    return reply("Ketik email:")
}

export async function processLogbookInteractiveReply(context, pending) {
    const { sender, text, reply } = context

    try {
        if (!pending) return

        if (pending.action === "logbook_setup_wait_email") {
            const email = text?.trim()
            if (!email || !email.includes("@")) {
                return reply("Email tidak valid. Ketik ulang email:")
            }
            // store email and ask password
            setPendingAction(sender, { action: "logbook_setup_wait_password", email, groupId: pending.groupId })
            return reply("Ketik password:")
        }

        if (pending.action === "logbook_setup_wait_password") {
            const password = text?.trim()
            if (!password) return reply("Password tidak boleh kosong. Ketik ulang password:")

            const email = pending.email
            await saveUserCredentials(sender, pending.groupId, email, password)
            clearPendingAction(sender)

            return reply(`✅ *Credentials berhasil disimpan*\n──────────\n\n📧 Email: ${email}\n🔐 Password: disimpan aman\n\nLanjutkan dengan:\n- /logbook matkul\n- /logbook fill [ID] [jam_mulai] [jam_selesai] "kegiatan"\n- /logbook delete`)
        }

        if (pending.action === "logbook_fill_wait_details") {
            // Build args like the normal command: ['fill', ...userParts]
            const userParts = text.trim().split(/\s+/)
            const newContext = { ...context, args: ["fill", ...userParts] }
            clearPendingAction(sender)
            return handleLogbookFill(newContext)
        }

    } catch (error) {
        console.error("Interactive setup error:", error)
        clearPendingAction(sender)
        return reply("❌ Terjadi error saat setup interaktif. Silakan coba lagi.")
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
            "Ketik: NOMOR JAM_MULAI JAM_SELESAI \"KEGIATAN\"\nContoh:\n1 07:00 16:00 \"Belajar chapter 5\"\n\n🔄 *Ambil daftar mata kuliah...*\n⏳ Memeriksa session (jika ada) atau login ke PENS...\n📚 Fetch matkul...\nTunggu sebentar..."
        )

        const { creds } = credsResult
        let result = await getAvailableMatakuliahCached(creds.email, creds.password)

        if (!result.success) {
            // Try forcing a fresh login once (session expired?)
            await sendOrEditMessage(context, progressKey, "🔄 Session mungkin kadaluarsa, mencoba relogin...")
            const retry = await getAvailableMatakuliahCached(creds.email, creds.password, { forceRefresh: true })
            if (retry.success) {
                result = retry
            } else {
                return sendOrEditMessage(
                    context,
                    progressKey,
                    `❌ Gagal ambil mata kuliah.\n\n${retry.message}\n\nCoba setup ulang:\n/logbook setup email password`
                )
            }
        }
        // let text = "Ketik: NOMOR JAM_MULAI JAM_SELESAI \"KEGIATAN\"\nContoh:\n1 07:00 16:00 \"Belajar chapter 5\"\n\n"
        let text = formatMatakuliahList(result.data.matakuliah)

        return sendOrEditMessage(context, progressKey, text)
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

        if (hasBlockedSqlKeyword(kegiatan)) {
            return reply("❌ Kegiatan mengandung kata yang tidak diizinkan.\n\nHINDARI KATA-KATA SELECT, INSERT, UPDATE, DAN DELETE KARENA MEMUNGKINKAN DATA LOGBOOK TIDAK TERSIMPAN.")
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
        let matkResult = await getAvailableMatakuliahCached(creds.email, creds.password)
        if (!matkResult.success) {
            // try forcing re-login once
            await sendOrEditMessage(context, progressKey, "🔄 Session mungkin kadaluarsa, mencoba relogin untuk submit...")
            const retry = await getAvailableMatakuliahCached(creds.email, creds.password, { forceRefresh: true })
            if (!retry.success) {
                return sendOrEditMessage(context, progressKey, `❌ Gagal ambil mata kuliah.\n\n${retry.message}`)
            }
            matkResult = retry
        }

        const matakuliahIndex = parseInt(matakuliahNumber) - 1
        const matkList = matkResult.data.matakuliah
        if (isNaN(matakuliahIndex) || matakuliahIndex < 0 || matakuliahIndex >= matkList.length) {
            return sendOrEditMessage(context, progressKey, `❌ Nomor mata kuliah tidak valid.\n\n${formatMatakuliahList(matkList)}`)
        }

        const selectedMatkul = matkList[matakuliahIndex]
        const sessionJar = getSessionJar(creds.email)
        const submitResult = await loginAndSubmitLogbook(creds.email, creds.password, {
            matakuliah: selectedMatkul.value,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            kegiatan: kegiatan,
            sesuai_kuliah: "1"
        }, sessionJar ? { jar: sessionJar } : {})

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
        case "fill":
            // If user invoked /logbook fill without details, show matkul list then start interactive flow
            if (args.length === 1) {
                const { sender, reply } = context

                // Ensure credentials exist and fetch matkul list
                const credsResult = await validateUserCredentials(sender, reply)
                if (!credsResult) return

                const { creds } = credsResult
                // show loading message while trying to fetch mata kuliah (will try session reuse first)
                const progressKey = await sendProgressMessage(context, `Ketik: NOMOR JAM_MULAI JAM_SELESAI \"KEGIATAN\"\nContoh:\n1 07:00 16:00 \"Belajar chapter 5\"\n\n🔄 Mengambil daftar mata kuliah...\nMemeriksa session, harap tunggu...`)

                const matkResult = await getAvailableMatakuliahCached(creds.email, creds.password)

                if (!matkResult.success) {
                    return sendOrEditMessage(context, progressKey, `❌ Gagal ambil mata kuliah.\n\n${matkResult.message}\n\nCoba setup ulang:\n/logbook setup email password`)
                }

                // Send formatted matkul list and prompt for details (edit loading message)
                await sendOrEditMessage(context, progressKey, "Ketik: NOMOR JAM_MULAI JAM_SELESAI \"KEGIATAN\"\nContoh:\n1 07:00 16:00 \"Belajar chapter 5\"\n\n" + formatMatakuliahList(matkResult.data.matakuliah))
                setPendingAction(context.sender, { action: "logbook_fill_wait_details", groupId: context.groupId })
                return
            }

            return handleLogbookFill(context)
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
