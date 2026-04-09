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
            `
📅 *Schedule Commands*

Ketik: /menu schedule
untuk bantuan lengkap ✨

Quick format:
/schedule 2026-02-25 08:00 Pesan
/schedule daily 08:00 Pesan
/schedule weekly monday 08:00 Pesan
/schedule working 08:00 Pesan
`
        )
    }

    if (args[0] === "list") {
        const schedules = await listSchedules(chatId)

        if (!schedules.length)
            return reply(`
📭 *Belum Ada Schedule*

Coba buat schedule baru:
/schedule daily 08:00 Pesan
`)

        const text = schedules.map(s => {
            const type = s.recurring_type ? `🔁 ${s.recurring_type.toUpperCase()}` : `⏱️  ONE-TIME`
            return `
╔════════════════════╗
🆔 ID: ${s.id}
⏰ ${s.schedule_time}
${type}
💬 ${s.message}
╚════════════════════╝`
        }).join("\n")

        return reply(`
📋 *Daftar Schedule-mu*

${text}

Hapus:
/schedule delete ID
`)
    }

    if (args[0] === "delete") {
        const id = parseInt(args[1])
        if (!id) return reply(`
❌ *Format Salah!*

Contoh:
/schedule delete 3
`)

        await deleteSchedule(id, chatId)
        return reply(`
🗑️  *Schedule Dihapus* ✅

ID ${id} sudah dihapus dari daftar.
`)
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
            return reply(`
❌ *Format Salah!*

Format yang benar:
/schedule weekly [hari] HH:MM Pesan

Contoh:
/schedule weekly monday 09:00 Report mingguan

Hari: sunday, monday, tuesday, wednesday, thursday, friday, saturday
`)

        const dayInput = args[1].toLowerCase()

        if (!isNaN(dayInput)) {
            recurringDay = parseInt(dayInput)
            if (recurringDay < 0 || recurringDay > 6)
                return reply(`
❌ Hari harus 0-6
0 = Minggu
1 = Senin
... dst
`)
        }

        else {
            recurringDay = dayMap[dayInput]
            if (recurringDay === undefined)
                return reply(`
❌ *Hari Tidak Valid*

Gunakan:
sunday, monday, tuesday, wednesday,
thursday, friday, saturday

Atau angka 0-6
`)
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

    if (!message) return reply(`
❌ *Pesan Tidak Boleh Kosong!*

Contoh lengkap:
/schedule daily 08:00 Selamat pagi semuanya!
`)

    await createSchedule({
        groupId: chatId,
        message,
        scheduleTime,
        recurringType,
        recurringDay
    })

    const typeLabel = !recurringType ? "⏱️  One-Time" :
        recurringType === "daily" ? "☀️  Setiap Hari" :
        recurringType === "weekly" ? "📍 Mingguan" :
        "💼 Hari Kerja"

    return reply(`
✅ *Schedule Berhasil Dibuat!*

${typeLabel}
⏰ ${scheduleTime.toTimeString().slice(0, 5)}
💬 ${message}

✨ Lihat semua:
/schedule list
`)
}