import { enqueueMessage } from "../services/messageQueue.js"

export async function handleMenu({ sock, groupId, args }) {
  const submenu = args[0]?.toLowerCase()

  if (!submenu) {
    return await enqueueMessage(sock, groupId, {
      text: `
╔═══════════════════════╗
║  🎓 CLASS MANAGER BOT ║
╚═══════════════════════╝

✨ *Pilih Fitur yang Kamu Butuhkan:*

📖 /menu logbook
   ✍️  Isi logbook via WhatsApp

🔔 /menu reminder
   ⏰ Atur pengingat logbook otomatis

📝 /menu task  
   ✅ Kelola tugas & deadline kelas

📅 /menu schedule
   📆 Jadwalkan pesan berkala

💖 /menu donate
   ❤️ Dukung pengembang

╔═══════════════════════╗
💬 Ketik: /menu [nama]
╚═══════════════════════╝
`
    })
  }

  if (submenu === "logbook") {
    return await enqueueMessage(sock, groupId, {
      text: `
╔════════════════════════╗
║ 📖 ISI LOGBOOK VIA WA  ║
╚════════════════════════╝

*⚙️  SETUP PERTAMA KALI*
  /logbook setup email@univ.ac.id password123
  📌 Simpan credentials untuk login

*📚 LIHAT DAFTAR MATA KULIAH*
  /logbook matkul
  📌 /logbook info-matkul
  📌 Tampilkan semua mata kuliah yang tersedia

*✍️  ISI LOGBOOK*
  /logbook fill MATKUL_ID jam_mulai jam_selesai kegiatan [sesuai_kuliah]
  📌 /logbook fill 12345 07:00 16:00 "Belajar chapter 5"
  📌 /logbook fill 12345 07:00 16:00 "Belajar chapter 5" 1

*ℹ️  LIHAT INFO*
  /logbook info
  📌 Cek email yang terdaftar

*🗑️  HAPUS CREDENTIALS*
  /logbook delete
  📌 Hapus akun dari database

────────────────────

💡 *Cara Kerja:*
1️⃣  Setup email & password sekali saja
2️⃣  Lihat list matakuliah dengan: /logbook matkul
3️⃣  Isi logbook dengan: /logbook fill
4️⃣  Bot otomatis login & submit logbook

🔐 *Keamanan:*
✓ Password tersimpan aman
✓ Hanya bisa diakses oleh user
✓ Bisa dihapus kapan saja

⚠️  *Important:*
Gunakan password yang sama dengan
akun di sistem logbook web!
`
    })
  }

  if (submenu === "reminder") {
    return await enqueueMessage(sock, groupId, {
      text: `
╔════════════════════════╗
║ 🔔 LOGBOOK REMINDER    ║
╚════════════════════════╝

*➕ TAMBAH REMINDER*
  /reminder add HH:MM
  📌 /reminder add 20:30

*📋 LIHAT SEMUA*
  /reminder list
  📌 Tampilkan reminder kamu

*🗑️  HAPUS REMINDER*
  /reminder delete HH:MM
  📌 /reminder delete 20:30

*✅ AKTIFKAN*
  /reminder on HH:MM
  📌 /reminder on 20:30

*❌ NONAKTIFKAN*
  /reminder off HH:MM
  📌 /reminder off 20:30

ℹ️ Format: HH:MM (24-jam)
💡 Contoh: 20:30 = jam 8 malam
`
    })
  }

  if (submenu === "task") {
    return await enqueueMessage(sock, groupId, {
      text: `
╔════════════════════════╗
║ 📝 CLASS TASKS         ║
╚════════════════════════╝

⏳ *Status: COMING SOON*

🚧 Fitur ini sedang dikembangkan...

📌 Nanti bisa:
  ✓ Buat daftar tugas kelas
  ✓ Set deadline
  ✓ Ingatkan deadline
  ✓ Tandai tugas selesai

🎯 Rencana rilis: Minggu depan
🚀 Stay tuned!
`
    })
  }

  if (submenu === "schedule") {
    return await enqueueMessage(sock, groupId, {
      text: `
╔════════════════════════╗
║ 📅 SCHEDULE MESSAGE    ║
╚════════════════════════╝

*🎯 SEKALI SAJA*
  /schedule YYYY-MM-DD HH:MM Pesan
  📌 /schedule 2026-02-25 14:30 Meeting dimulai

*☀️  SETIAP HARI*
  /schedule daily HH:MM Pesan
  📌 /schedule daily 08:00 Selamat pagi

*📍 MINGGUAN*
  /schedule weekly [hari] HH:MM Pesan
  📌 /schedule weekly monday 09:00 Report mingguan
  
  Hari: sunday, monday, tuesday, 
        wednesday, thursday, friday, saturday

*💼 HARI KERJA (SEN-JUM)*
  /schedule working HH:MM Pesan
  📌 /schedule working 08:00 Standup pagi

────────────────────

*📋 LIHAT SCHEDULE*
  /schedule list

*🗑️  HAPUS SCHEDULE*
  /schedule delete ID
  📌 /schedule delete 3
`
    })
  }

  if (submenu === "donate") {
    return await enqueueMessage(sock, groupId, {
      text: `
╔════════════════════════╗
║ 💖 SUPPORT BOT INI     ║
╚════════════════════════╝

🙏 *Terima kasih sudah pakai bot ini!*

Jika bot ini membantu & bermanfaat,
kamu bisa mendukung pengembangannya 💪

👤 *A/N: Marcel Dwi Astika*

*🏦 TRANSFER BANK*

  💳 *BCA*
     0501165076

  💳 *SeaBank*
     901770566633

*📱 E-WALLET*
  0895339390753
  (OVO • DANA • GoPay • ShopeePay)

────────────────────

✨ Setiap donasi sangat berarti!
🔥 Bantu kami develop fitur baru
🚀 Terima kasih banyak! 🙌
`
    })
  }

  return await enqueueMessage(sock, groupId, {
    text: `
❌ *Menu tidak dikenal!*

Pilih salah satu:
  📖 /menu logbook
  🔔 /menu reminder
  📝 /menu task
  📅 /menu schedule
  💖 /menu donate

✨ Atau ketik: /menu
`
  })
}

export async function handleTask({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `
📝 *QUICK HELP*

Ketik: /menu task
untuk melihat detail perintah task ✨
`
  })
}

export async function handleSchedule({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `
📅 *QUICK HELP*

Ketik: /menu schedule
untuk melihat detail perintah schedule ✨
`
  })
}
