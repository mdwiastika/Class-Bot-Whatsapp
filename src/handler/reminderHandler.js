import { createReminder, getReminders, deleteReminder, toggleReminder } from "../repositories/reminderRepository.js"
import { isValidTimeFormat } from "../utils/validation.js"

export async function handleReminder(context) {
    const { args, groupId, userNumber, reply } = context

    if (!args.length || !args[0]) {
        return reply(`🔔 *Perintah Reminder*
──────────

- /reminder add HH:MM
- /reminder list
- /reminder delete HH:MM
- /reminder on HH:MM
- /reminder off HH:MM`)
    }

    const action = args[0].toLowerCase()
    const time = args[1]

    if (action === "add") {
        if (!time || !isValidTimeFormat(time)) {
            return reply("❌ Format salah.\n\nContoh:\n/reminder add 20:30")
        }

        await createReminder(groupId, userNumber, time)
        return reply(`✅ Reminder ditambahkan.\n\n⏰ Jam: ${time}`)
    }

    if (action === "list") {
        const reminders = await getReminders(groupId, userNumber)

        if (reminders.length === 0) {
            return reply("📭 Belum ada reminder.\n\nCoba:\n/reminder add 20:30")
        }

        const formatted = reminders.map(r => {
            const status = r.is_active ? "✅ AKTIF" : "⏸️  MATI"
            return `  ⏰ ${r.reminder_time}  ${status}`
        }).join("\n")

        return reply(`📋 *Reminder Kamu*
──────────

${formatted}

Kelola:
- /reminder on HH:MM
- /reminder off HH:MM
- /reminder delete HH:MM`)
    }

    if (action === "delete") {
        if (!time) {
            return reply("❌ Format salah.\n\nContoh:\n/reminder delete 20:30")
        }

        await deleteReminder(groupId, userNumber, time)
        return reply("✅ Reminder dihapus.")
    }

    if (action === "off") {
        if (!time) {
            return reply("❌ Format salah.\n\nContoh:\n/reminder off 20:30")
        }

        await toggleReminder(groupId, userNumber, time, false)
        return reply("⏸️ Reminder dimatikan.")
    }

    if (action === "on") {
        if (!time) {
            return reply("❌ Format salah.\n\nContoh:\n/reminder on 20:30")
        }

        await toggleReminder(groupId, userNumber, time, true)
        return reply("✅ Reminder diaktifkan.")
    }
}
