import { enqueueMessage } from "../services/messageQueue.js"

export async function handleMenu({ sock, groupId, args }) {
  const submenu = args[0]?.toLowerCase()

  if (!submenu) {
    return await enqueueMessage(sock, groupId, {
      text: `🎓 *Class Manager Bot*
──────────

Pilih fitur:
- 📖 /menu logbook
- 🔔 /menu reminder
- 📝 /menu task
- 📅 /menu schedule
- 💖 /menu donate

Ketik */menu [nama-fitur]* untuk lihat detail.`
    })
  }

  if (submenu === "logbook") {
    return await enqueueMessage(sock, groupId, {
      text: `📖 *Menu Logbook*
──────────

Perintah utama:
- /logbook setup email@pens.ac.id password
- /logbook matkul
- /logbook fill NOMOR HH:MM HH:MM "kegiatan"
- /logbook info
- /logbook delete

Contoh:
/logbook fill 1 07:00 16:00 "Belajar chapter 5"`
    })
  }

  if (submenu === "reminder") {
    return await enqueueMessage(sock, groupId, {
      text: `🔔 *Menu Reminder*
──────────

Perintah:
- /reminder add HH:MM
- /reminder list
- /reminder delete HH:MM
- /reminder on HH:MM
- /reminder off HH:MM

Format waktu: HH:MM (24 jam)
Contoh: /reminder add 20:30`
    })
  }

  if (submenu === "task") {
    return await enqueueMessage(sock, groupId, {
      text: `📝 *Task*
──────────

Fitur ini masih dalam pengembangan.
Nanti akan ada manajemen tugas & deadline kelas.`
    })
  }

  if (submenu === "schedule") {
    return await enqueueMessage(sock, groupId, {
      text: `📅 *Menu Schedule*
──────────

Jenis schedule:
- /schedule YYYY-MM-DD HH:MM Pesan
- /schedule daily HH:MM Pesan
- /schedule weekly [hari] HH:MM Pesan
- /schedule working HH:MM Pesan

Kelola schedule:
- /schedule list
- /schedule delete ID

Contoh:
/schedule daily 08:00 Selamat pagi`
    })
  }

  if (submenu === "donate") {
    return await enqueueMessage(sock, groupId, {
      text: `💖 *Support Bot*
──────────

Terima kasih sudah pakai bot ini.
Kalau bot ini membantu, kamu bisa support di:

👤 A/N: Marcel Dwi Astika
🏦 BCA: 0501165076
🏦 SeaBank: 901770566633
📱 E-Wallet: 0895339390753
(OVO, DANA, GoPay, ShopeePay)

Terima kasih banyak 🙌`
    })
  }

  return await enqueueMessage(sock, groupId, {
    text: `❌ Menu tidak dikenal.

Pilihan tersedia:
- /menu logbook
- /menu reminder
- /menu task
- /menu schedule
- /menu donate`
  })
}

export async function handleTask({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `📝 Ketik /menu task untuk melihat detail fitur task.`
  })
}

export async function handleSchedule({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `📅 Ketik /menu schedule untuk melihat detail perintah schedule.`
  })
}
