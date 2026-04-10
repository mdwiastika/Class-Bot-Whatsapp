import {
    createReminder,
    getReminders,
    deleteReminder,
    toggleReminder
} from "../repositories/reminderRepository.js"
import { isValidTimeFormat } from "../utils/validation.js"

export async function handleReminder(context) {
    const { args, groupId, userNumber, reply } = context

    if (!args.length || !args[0]) {
        return reply(`
🔔 *Reminder Commands*

Ketik: /menu reminder
untuk melihat bantuan lengkap ✨

Quick:
/reminder add HH:MM
/reminder list
/reminder delete HH:MM
/reminder on/off HH:MM
`)
    }

    const action = args[0].toLowerCase()

    if (action === "add") {
        const time = args[1]

        if (!time || !isValidTimeFormat(time)) {
            return reply(`
❌ *Format Salah!*

Format yang benar:
/reminder add HH:MM

📌 Contoh:
/reminder add 20:30

Gunakan format 24-jam (00:00 - 23:59)
`)
        }

        await createReminder(groupId, userNumber, time)

        return reply(`
✅ *Reminder Berhasil Ditambahkan!*

⏰ Jam: ${time}
📌 Kamu akan diingatkan setiap hari jam ${time}

Ketik: /reminder list
Untuk melihat semua reminder-mu 📋
`)
    }

    if (action === "list") {
        const reminders = await getReminders(groupId, userNumber)

        if (reminders.length === 0) {
            return reply(`
📭 *Belum Ada Reminder*

Kamu belum punya pengingat logbook.

Coba tambahkan:
/reminder add 20:30
`)
        }

        const formatted = reminders.map(r => {
            const status = r.is_active ? "✅ AKTIF" : "⏸️  MATI"
            return `  ⏰ ${r.reminder_time}  ${status}`
        }).join("\n")

        return reply(`
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
`)
    }

    if (action === "delete") {
        const time = args[1]

        if (!time) {
            return reply(`
❌ *Format Salah!*

Contoh:
/reminder delete 20:30
`)
        }

        await deleteReminder(groupId, userNumber, time)

        return reply(`
🗑️  *Reminder Dihapus*

Reminder jam ${time} sudah dihapus ✅

Ketik: /reminder list
Untuk lihat reminder lainnya
`)
    }

    if (action === "off") {
        const time = args[1]

        if (!time) {
            return reply(`
❌ *Format Salah!*

Contoh:
/reminder off 20:30
`)
        }

        await toggleReminder(groupId, userNumber, time, false)

        return reply(`
⏸️  *Reminder Dimatikan*

Reminder jam ${time} sekarang MATI 🔴

Nyalakan lagi:
/reminder on ${time}
`)
    }

    if (action === "on") {
        const time = args[1]

        if (!time) {
            return reply(`
❌ *Format Salah!*

Contoh:
/reminder on 20:30
`)
        }

        await toggleReminder(groupId, userNumber, time, true)

        return reply(`
✅ *Reminder Diaktifkan*

Reminder jam ${time} sekarang AKTIF 🟢

Matikan lagi:
/reminder off ${time}
`)
    }
}
