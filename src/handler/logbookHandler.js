import { enqueueMessage } from "../services/messageQueue.js"
import { saveUserCredentials, getUserCredentials, deleteUserCredentials } from "../repositories/userCredentialsRepository.js"
import { getAvailableMatakuliah, loginAndSubmitLogbook, formatMatakuliahList } from "../services/pensLogbookService.js"

export async function handleLogbook(context) {
    const { args, groupId, sender, reply } = context

    if (!args.length) {
        return reply(`
📖 *LOGBOOK COMMANDS*

Ketik: /menu logbook
untuk melihat bantuan lengkap ✨

Quick:
/logbook setup email password
/logbook matkul (atau /logbook info-matkul)
/logbook fill NOMOR jam_mulai jam_selesai kegiatan
/logbook info
/logbook delete
`)
    }

    const action = args[0].toLowerCase()

    // ==================== SETUP ====================
    if (action === "setup") {
        const email = args[1]
        const password = args[2]

        if (!email || !password) {
            return reply(`
❌ *Format Salah!*

Format yang benar:
/logbook setup email@pens.ac.id password

🔐 Password akan disimpan terenkripsi di database!

Contoh:
/logbook setup mdwiastika@it.student.pens.ac.id MyPassword123
`)
        }

        try {
            await saveUserCredentials(sender, groupId, email, password)

            return reply(`
✅ *Credentials Berhasil Disimpan!*

📧 Email: ${email}
🔐 Password: ****(tersimpan aman)

Sekarang kamu bisa:

1️⃣  /logbook matkul
   → Lihat daftar mata kuliah

2️⃣  /logbook fill [ID] [jam_mulai] [jam_selesai] "kegiatan"
   → Isi logbook langsung

Untuk hapus:
/logbook delete
`)
        } catch (error) {
            console.error("Setup credentials error:", error)
            return reply(`
❌ *Error!*

Gagal menyimpan credentials.
Coba lagi atau hubungi admin.
`)
        }
    }

    // ==================== MATKUL / INFO-MATKUL ====================
    if (action === "matkul" || action === "info-matkul" || action === "info-matkul-id") {
        try {
            const creds = await getUserCredentials(sender)

            if (!creds) {
                return reply(`
⚠️  *Belum Setup!*

Kamu harus setup credentials dulu:
/logbook setup email@pens.ac.id password

Setup sekarang, lalu coba lagi!
`)
            }

            await reply(`
🔄 *Sedang ambil daftar mata kuliah...*

⏳ Login ke sistem PENS...
📚 Fetch daftar mata kuliah...
📋 Extract mata kuliah ID...

Tunggu sebentar... 🕐
`)

            // Get mata kuliah list
            const result = await getAvailableMatakuliah(creds.email, creds.password)

            if (!result.success) {
                return reply(`
❌ *Gagal Ambil Mata Kuliah!*

${result.message}

💡 Kemungkinan:
• Email/Password salah
• Server PENS sedang offline
• Koneksi internet error

Solusi:
/logbook setup email@pens.ac.id password
→ untuk setup ulang credentials
`)
            }

            const formattedList = formatMatakuliahList(result.data.matakuliah)

            return reply(formattedList)

        } catch (error) {
            console.error("Matkul error:", error)
            return reply(`
❌ *Error!*

${error.message}

Gagal mengambil daftar mata kuliah.
Coba lagi atau hubungi admin.
`)
        }
    }

    // ==================== FILL ====================
    if (action === "fill") {
        try {
            const creds = await getUserCredentials(sender)

            if (!creds) {
                return reply(`
⚠️  *Belum Setup!*

Kamu harus setup credentials dulu:
/logbook setup email@pens.ac.id password

Setup sekarang, lalu coba lagi!
`)
            }

            // Parse arguments
            const matakuliahNumber = args[1]
            const jamMulai = args[2]
            const jamSelesai = args[3]
            const kegiatan = args.slice(4).join(" ").replace(/"/g, '')
            const sesuaiKuliah = "1"

            // Validate arguments
            if (!matakuliahNumber || !jamMulai || !jamSelesai || !kegiatan) {
                return reply(`
❌ *Format Salah!*

Format yang benar:
/logbook fill NOMOR JAM_MULAI JAM_SELESAI "KEGIATAN"

Contoh:
/logbook fill 1 07:00 16:00 "Belajar chapter 5"

NOMOR: Dari daftar /logbook matkul (1, 2, 3, dst)
JAM format: HH:MM (24-jam)

Help:
/logbook matkul
→ Lihat daftar mata kuliah
`)
            }

            // Validate time format
            if (!/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai)) {
                return reply(`
❌ *Format Jam Salah!*

Format harus: HH:MM (24-jam)

Contoh benar:
• 07:00 (jam 7 pagi)
• 16:00 (jam 4 sore)
• 23:59 (jam 11:59 malam)

Coba lagi!
`)
            }

            await reply(`
🔄 *Proses Isi Logbook...*

⏳ Login ke sistem PENS...
📝 Validasi mata kuliah...
🚀 Submit logbook...

Tunggu sebentar... 🕐
`)

            // Get matakuliah list to convert number to ID
            const result = await getAvailableMatakuliah(creds.email, creds.password)
            if (!result.success) {
                return reply(`
❌ *Gagal Ambil Mata Kuliah!*

${result.message}

Kemungkinan:
• Email/Password salah
• Server PENS sedang offline
• Koneksi internet error

Coba lagi:
/logbook fill [NOMOR] [jam_mulai] [jam_selesai] "kegiatan"
`)
            }

            const matakuliahIndex = parseInt(matakuliahNumber) - 1
            if (isNaN(matakuliahIndex) || matakuliahIndex < 0 || matakuliahIndex >= result.data.matakuliah.length) {
                return reply(`
❌ *Nomor Mata Kuliah Tidak Valid!*

Daftar mata kuliah:
${formatMatakuliahList(result.data.matakuliah)}
`)
            }

            const selectedMatkul = result.data.matakuliah[matakuliahIndex]

            // Submit logbook
            const submitResult = await loginAndSubmitLogbook(creds.email, creds.password, {
                matakuliah: selectedMatkul.value,
                jam_mulai: jamMulai,
                jam_selesai: jamSelesai,
                kegiatan: kegiatan,
                sesuai_kuliah: sesuaiKuliah
            })

            if (submitResult.success) {
                return reply(`
✅ *Logbook Berhasil Diisi!*

╔════════════════════════════════╗
📚 Mata Kuliah: ${submitResult.data.matakuliah}
📅 Tanggal: ${submitResult.data.tanggal}
⏰ Jam: ${submitResult.data.jam_mulai} - ${submitResult.data.jam_selesai}
💬 Kegiatan: ${submitResult.data.kegiatan}
✅ Sesuai Kuliah: ${submitResult.data.sesuai_kuliah === '1' ? 'Ya' : 'Tidak'}
╚════════════════════════════════╝

🎉 Logbook sudah tersimpan di sistem PENS!

📌 Tips:
• Gunakan /logbook fill untuk isi logbook lagi
• /logbook matkul untuk lihat daftar mata kuliah
`)
            } else {
                return reply(`
❌ *Gagal Isi Logbook!*

${submitResult.message}

Kemungkinan:
• Email/Password salah
• Server PENS sedang offline
• Format data tidak valid

Solusi:
1. /logbook matkul → Cek daftar mata kuliah
2. /logbook setup → Jika password berubah
3. Coba lagi dalam beberapa saat
`)
            }

        } catch (error) {
            console.error("Fill logbook error:", error)
            return reply(`
❌ *Error!*

${error.message}

Gagal mengisi logbook.
Coba lagi atau hubungi admin.
`)
        }
    }

    // ==================== INFO ====================
    if (action === "info") {
        try {
            const creds = await getUserCredentials(sender)

            if (!creds) {
                return reply(`
📭 *Belum Ada Credentials*

Kamu belum setup email & password.

Setup sekarang:
/logbook setup email@pens.ac.id password
`)
            }

            return reply(`
╔════════════════════════════════╗
║ 📋 INFO CREDENTIALS            ║
╚════════════════════════════════╝

📧 Email: ${creds.email}
🔐 Password: ****(tersimpan aman)
📅 Setup pada: ${new Date(creds.created_at).toLocaleDateString('id-ID')}
🕒 Update: ${new Date(creds.updated_at).toLocaleDateString('id-ID')}

✨ Status: Siap digunakan!

Perintah:
/logbook matkul → Daftar mata kuliah
/logbook fill → Isi logbook
/logbook delete → Hapus credentials
`)
        } catch (error) {
            console.error("Get info error:", error)
            return reply(`
❌ *Error!*

Gagal mengambil informasi.
Coba lagi atau hubungi admin.
`)
        }
    }

    // ==================== DELETE ====================
    if (action === "delete") {
        try {
            const creds = await getUserCredentials(sender)

            if (!creds) {
                return reply(`
📭 *Belum Ada Credentials*

Tidak ada yang bisa dihapus.
`)
            }

            await deleteUserCredentials(sender)

            return reply(`
🗑️  *Credentials Dihapus* ✅

Email & password sudah dihapus dari database.
Data aman, tidak ada informasi yang tertinggal.

Untuk setup lagi:
/logbook setup email@pens.ac.id password
`)
        } catch (error) {
            console.error("Delete credentials error:", error)
            return reply(`
❌ *Error!*

Gagal menghapus credentials.
Coba lagi atau hubungi admin.
`)
        }
    }

    return reply(`
❌ *Action Tidak Dikenal!*

Pilihan:
/logbook setup email password
/logbook matkul
/logbook fill NOMOR jam_mulai jam_selesai kegiatan
/logbook info
/logbook delete

Ketik: /menu logbook
untuk bantuan lengkap
`)
}
