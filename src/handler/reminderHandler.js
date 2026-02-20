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

/reminder add HH:MM
/reminder list
/reminder delete HH:MM
/reminder on HH:MM
/reminder off HH:MM
`
        })
    }

    const action = args[1].toLowerCase()

    if (action === "add") {
        const time = args[2]

        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            return enqueueMessage(sock, groupId, {
                text: "❌ Format salah.\nContoh: /reminder add 20:30"
            })
        }

        await createReminder(groupId, userNumber, time)

        return enqueueMessage(sock, groupId, {
            text: `✅ Reminder berhasil ditambahkan jam ${time}`
        })
    }

    if (action === "list") {

        const reminders = await getReminders(groupId, userNumber)

        if (reminders.length === 0) {
            return enqueueMessage(sock, groupId, {
                text: "📭 Kamu belum punya reminder."
            })
        }

        const formatted = reminders.map(r => {
            const status = r.is_active ? "🟢 ON" : "🔴 OFF"
            return `• ${r.reminder_time} (${status})`
        }).join("\n")

        return enqueueMessage(sock, groupId, {
            text: `🔔 *Your Reminders*\n\n${formatted}`
        })
    }

    if (action === "delete") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: "Contoh: /reminder delete 20:30"
            })
        }

        await deleteReminder(groupId, userNumber, time)

        return enqueueMessage(sock, groupId, {
            text: `🗑 Reminder ${time} berhasil dihapus`
        })
    }

    if (action === "off") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: "Contoh: /reminder off 20:30"
            })
        }

        await toggleReminder(groupId, userNumber, time, false)

        return enqueueMessage(sock, groupId, {
            text: `⏸ Reminder ${time} dimatikan`
        })
    }

    if (action === "on") {
        const time = args[2]

        if (!time) {
            return enqueueMessage(sock, groupId, {
                text: "Contoh: /reminder on 20:30"
            })
        }

        await toggleReminder(groupId, userNumber, time, true)

        return enqueueMessage(sock, groupId, {
            text: `▶ Reminder ${time} diaktifkan`
        })
    }
}