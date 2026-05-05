import { createSchedule, listSchedules, deleteSchedule } from "../services/scheduleService.js"

const DAYS = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
}

export async function handleSchedule(context) {
    const { args, groupId, reply } = context

    if (!args.length) {
        return reply(`📅 *Perintah Schedule*
──────────

- /schedule YYYY-MM-DD HH:MM Pesan
- /schedule daily HH:MM Pesan
- /schedule weekly [hari] HH:MM Pesan
- /schedule working HH:MM Pesan
- /schedule list
- /schedule delete ID`)
    }

    if (args[0] === "list") {
        const schedules = await listSchedules(groupId)

        if (!schedules.length) {
            return reply("📭 Belum ada schedule.\n\nContoh:\n/schedule daily 08:00 Pesan")
        }

        const text = schedules.map(s => {
            const type = s.recurring_type ? `🔁 ${s.recurring_type.toUpperCase()}` : `⏱️  ONE-TIME`
            return `🆔 ${s.id} | ⏰ ${s.schedule_time} | ${type}\n💬 ${s.message}`
        }).join("\n\n")

        return reply(`📋 *Schedule Kamu*
──────────

${text}

Hapus schedule:
/schedule delete ID`)
    }

    if (args[0] === "delete") {
        const id = args[1]
        if (!id) return reply("❌ Format salah.\n\nGunakan:\n/schedule delete ID")

        await deleteSchedule(id, groupId)
        return reply("✅ Schedule dihapus.")
    }

    let recurringType = null
    let recurringDay = null
    let scheduleTime = null
    let message = null

    if (args[0] === "daily") {
        recurringType = "daily"
        scheduleTime = new Date(`1970-01-01 ${args[1]}`)
        message = args.slice(2).join(" ")
    }
    else if (args[0] === "weekly") {
        const day = args[1]?.toLowerCase()
        recurringDay = DAYS[day]

        if (recurringDay === undefined) {
            return reply("❌ Hari tidak valid.\n\nGunakan: sunday, monday, tuesday, wednesday, thursday, friday, saturday")
        }

        recurringType = "weekly"
        scheduleTime = new Date(`1970-01-01 ${args[2]}`)
        message = args.slice(3).join(" ")
    }
    else if (args[0] === "working") {
        recurringType = "working_days"
        scheduleTime = new Date(`1970-01-01 ${args[1]}`)
        message = args.slice(2).join(" ")
    }
    else {
        scheduleTime = new Date(`${args[0]} ${args[1]}`)
        message = args.slice(2).join(" ")
    }

    if (!message) {
        return reply("❌ Pesan tidak boleh kosong.\n\nContoh:\n/schedule daily 08:00 Selamat pagi!")
    }

    await createSchedule({
        groupId: groupId,
        message,
        scheduleTime,
        recurringType,
        recurringDay
    })

    const typeLabel = !recurringType ? "⏱️  One-Time" :
        recurringType === "daily" ? "☀️  Setiap Hari" :
        recurringType === "weekly" ? "📍 Mingguan" :
        "💼 Hari Kerja"

    return reply(`✅ *Schedule berhasil dibuat*
──────────

${typeLabel}
⏰ ${scheduleTime.toTimeString().slice(0, 5)}
💬 ${message}`)
}
