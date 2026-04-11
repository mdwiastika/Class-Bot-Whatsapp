import { createReminder, getReminders, deleteReminder, toggleReminder } from "../repositories/reminderRepository.js"
import { isValidTimeFormat } from "../utils/validation.js"

export async function handleReminder(context) {
    const { args, groupId, userNumber, reply } = context

    if (!args.length || !args[0]) {
        return reply(`🔔 *Reminder Commands*\n\n/reminder add HH:MM\n/reminder list\n/reminder delete HH:MM\n/reminder on/off HH:MM`)
    }

    const action = args[0].toLowerCase()
    const time = args[1]

    if (action === "add") {
        if (!time || !isValidTimeFormat(time)) {
            return reply(`❌ *Format Salah!*\n\nFormat: /reminder add HH:MM\n\nContoh: /reminder add 20:30`)
        }

        await createReminder(groupId, userNumber, time)
        return reply(`✅ *Reminder Ditambahkan!*\n\n⏰ Jam: ${time}\n📌 Kamu akan diingatkan setiap hari`)
    }

    if (action === "list") {
        const reminders = await getReminders(groupId, userNumber)

        if (reminders.length === 0) {
            return reply(`📭 *Belum Ada Reminder*\n\nCoba: /reminder add 20:30`)
        }

        const formatted = reminders.map(r => {
            const status = r.is_active ? "✅ AKTIF" : "⏸️  MATI"
            return `  ⏰ ${r.reminder_time}  ${status}`
        }).join("\n")

        return reply(`📋 *REMINDER-MU*\n\n${formatted}\n\n/reminder on HH:MM → Aktifkan\n/reminder off HH:MM → Nonaktifkan\n/reminder delete HH:MM → Hapus`)
    }

    if (action === "delete") {
        if (!time) {
            return reply(`❌ *Format Salah!*\n\nContoh: /reminder delete 20:30`)
        }

        await deleteReminder(groupId, userNumber, time)
        return reply(`🗑️  *Reminder Dihapus*`)
    }

    if (action === "off") {
        if (!time) {
            return reply(`❌ *Format Salah!*\n\nContoh: /reminder off 20:30`)
        }

        await toggleReminder(groupId, userNumber, time, false)
        return reply(`⏸️  *Reminder Dimatikan*`)
    }

    if (action === "on") {
        if (!time) {
            return reply(`❌ *Format Salah!*\n\nContoh: /reminder on 20:30`)
        }

        await toggleReminder(groupId, userNumber, time, true)
        return reply(`✅ *Reminder Diaktifkan*`)
    }
}
