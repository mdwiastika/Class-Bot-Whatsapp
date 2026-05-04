import { createSchedule, listSchedules, deleteSchedule } from "../services/scheduleService.js"
import { buildScheduleMenu } from "../utils/listMessageBuilder.js"
import { enqueueMessage } from "../services/messageQueue.js"

const DAYS = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
}

export async function handleSchedule(context) {
    const { args, groupId, reply, sock } = context

    if (!args.length) {
        return await enqueueMessage(sock, groupId, buildScheduleMenu())
    }

    if (args[0] === "list") {
        const schedules = await listSchedules(groupId)

        if (!schedules.length) {
            return reply(`📭 *Belum Ada Schedule*\n\nBuat: /schedule daily 08:00 Pesan`)
        }

        const text = schedules.map(s => {
            const type = s.recurring_type ? `🔁 ${s.recurring_type.toUpperCase()}` : `⏱️  ONE-TIME`
            return `🆔 ${s.id} | ⏰ ${s.schedule_time} | ${type}\n💬 ${s.message}`
        }).join("\n\n")

        return reply(`📋 *Schedule-mu*\n\n${text}\n\nHapus: /schedule delete ID`)
    }

    if (args[0] === "delete") {
        const id = args[1]
        if (!id) return reply(`❌ *Format Salah!*\n\n/schedule delete ID`)

        await deleteSchedule(id, groupId)
        return reply(`✅ *Schedule Dihapus!*`)
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
            return reply(`❌ *Hari Tidak Valid!*\n\nmonday, tuesday, wednesday, thursday, friday, saturday, sunday`)
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
        return reply(`❌ *Pesan Kosong!*\n\n/schedule daily 08:00 Selamat pagi!`)
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

    return reply(`✅ *Schedule Dibuat!*\n\n${typeLabel}\n⏰ ${scheduleTime.toTimeString().slice(0, 5)}\n💬 ${message}`)
}
