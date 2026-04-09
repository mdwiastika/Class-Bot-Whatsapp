import {
    createReminder,
    getReminders,
    deleteReminder,
    toggleReminder
} from "../repositories/reminderRepository.js"
import { enqueueMessage } from "../services/messageQueue.js"

export async function handleReminder({ sock, groupId, userNumber, text }) {

    const args = text.trim().split(/\s+/)

    if (!args[1]) {
        return enqueueMessage(sock, groupId, {
            text: `
🔔 *Reminder Commands*

Ketik: /menu reminder
untuk melihat bantuan lengkap ✨

Quick:
/reminder add HH:MM
/reminder list
/reminder delete HH:MM
/reminder on/off HH:MM
`
        })
    }

    const action = args[1].toLowerCase()

    if (action === "add") {
        const time = args[2]

        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            return enqueueMessage(sock, groupId, {
                text: `
❌ *Format Salah!*

Format yang benar:
/reminder add HH:MM

📌 Contoh:
/reminder add 20:30

Gunakan format 24-jam (00:00 - 23:59)
`
            })
        }

        await createReminder(groupId, userNumber, time)

        return enqueueMessage(sock, groupId, {
            text: `
✅ *Reminder Berhasil Ditambahkan!*

⏰ Jam: ${time}
📌 Kamu akan diingatkan setiap hari jam ${time}

Ketik: /reminder list
Untuk melihat semua reminder-mu 📋
`
        })
    }

    if (action === "list") {

        const reminders = await getReminders(groupId, userNumber)

        if (reminders.length === 0) {
            return enqueueMessage(sock, groupId, {
                text: `
📭 *Belum Ada Reminder*

Kamu belum punya pengingat logbook.

Coba tambahkan:
/reminder add 20:30
`
            })
        }

        const formatted = reminders.map(r => {
            const status = r.is_active ? "✅ AKTIF" : "⏸️  MATI"
            return `  ⏰ ${r.reminder_time}  ${status}`
        }).join("\n")

        return enqueueMessage(sock, groupId, {
            text: `
╔════════════════════╗
║ 📋 REMINDER-MU     ║
╚════════════════════╝

${formatted}

────────────────────
✨ Total: ${reminders.length} reminder

🔧 Untuk mengubah:
/reminder on HH:MM  → Aktifkan
/reminder off HH:MM → Nonaktifkan
/reminder delete HH:MM → Hapus
`
        })
    }

    if (action === "delete") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: `
❌ *Format Salah!*

Contoh:
/reminder delete 20:30
`
            })
        }

        await deleteReminder(groupId, userNumber, time)

        return enqueueMessage(sock, groupId, {
            text: `
🗑️  *Reminder Dihapus*

Reminder jam ${time} sudah dihapus ✅

Ketik: /reminder list
Untuk lihat reminder lainnya
`
        })
    }

    if (action === "off") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: `
❌ *Format Salah!*

Contoh:
/reminder off 20:30
`
            })
        }

        await toggleReminder(groupId, userNumber, time, false)

        return enqueueMessage(sock, groupId, {
            text: `
⏸️  *Reminder Dimatikan*

Reminder jam ${time} sekarang MATI 🔴

Nyalakan lagi:
/reminder on ${time}
`
        })
    }

    if (action === "on") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: `
❌ *Format Salah!*

Contoh:
/reminder on 20:30
`
            })
        }

        await toggleReminder(groupId, userNumber, time, true)

        return enqueueMessage(sock, groupId, {
            text: `
✅ *Reminder Diaktifkan*

Reminder jam ${time} sekarang AKTIF 🟢

Matikan lagi:
/reminder off ${time}
`
        })
    }
}