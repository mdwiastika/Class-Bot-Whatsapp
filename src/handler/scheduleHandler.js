import {
    createSchedule,
    listSchedules,
    deleteSchedule
} from "../services/scheduleService.js"


const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
}

export async function handleSchedule(context) {
    const { args, chatId, reply } = context

    if (!args.length) {
        return reply(
            `Format:
/schedule 2026-02-25 08:00 Pesan
/schedule daily 08:00 Pesan
/schedule weekly 1 08:00 Pesan
/schedule working 08:00 Pesan`
        )
    }

    if (args[0] === "list") {
        const schedules = await listSchedules(chatId)

        if (!schedules.length)
            return reply("Tidak ada schedule.")

        const text = schedules.map(s =>
            `ID: ${s.id}
${s.message}
⏰ ${s.schedule_time}
🔁 ${s.recurring_type ?? "one-time"}`
        ).join("\n\n")

        return reply(text)
    }

    if (args[0] === "delete") {
        const id = parseInt(args[1])
        if (!id) return reply("Masukkan ID")

        await deleteSchedule(id, chatId)
        return reply("Schedule dihapus ✅")
    }

    let recurringType = null
    let recurringDay = null
    let scheduleTime
    let message

    if (args[0] === "daily") {
        recurringType = "daily"
        scheduleTime = new Date(`1970-01-01 ${args[1]}`)
        message = args.slice(2).join(" ")
    }

    else if (args[0] === "weekly") {

        if (args.length < 4)
            return reply("Format: /schedule weekly monday 09:00 Your message")

        const dayInput = args[1].toLowerCase()

        if (!isNaN(dayInput)) {
            recurringDay = parseInt(dayInput)
            if (recurringDay < 0 || recurringDay > 6)
                return reply("Day must be between 0 (Sunday) and 6 (Saturday)")
        }

        else {
            recurringDay = dayMap[dayInput]
            if (recurringDay === undefined)
                return reply(
                    "Invalid day.\nUse: sunday, monday, tuesday, wednesday, thursday, friday, saturday"
                )
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

    if (!message) return reply("Pesan tidak boleh kosong")

    await createSchedule({
        groupId: chatId,
        message,
        scheduleTime,
        recurringType,
        recurringDay
    })

    return reply("Schedule berhasil dibuat ✅")
}