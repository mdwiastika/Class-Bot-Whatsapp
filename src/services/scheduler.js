// services/scheduler.js
import cron from "node-cron"
import {
    getActiveSchedules,
    markSent,
    deactivate
} from "./scheduleService.js"
import { enqueueMessage } from "./messageQueue.js"

export function startGlobalScheduler(sock) {

    cron.schedule("* * * * *", async () => {
        try {
            console.log("Running global scheduler check...") // Debug log
            const schedules = await getActiveSchedules()

            const now = new Date()
            const today = now.getDay()
            const hour = now.getHours()
            const minute = now.getMinutes()
            console.log(`Current time: ${hour}:${minute}, Total active schedules: ${schedules.length}`) // Debug log

            for (const schedule of schedules) {

                const scheduleDate = new Date(schedule.schedule_time)
                console.log(`Checking schedule ID ${schedule.id} - Scheduled time: ${scheduleDate.toTimeString().slice(0, 5)}, Recurring: ${schedule.recurring_type}`) // Debug log

                if (scheduleDate.getHours() !== hour || scheduleDate.getMinutes() !== minute) {
                    console.log(`Skip ID ${schedule.id}: time mismatch`)
                    continue
                }

                if (schedule.last_sent_at) {
                    const last = new Date(schedule.last_sent_at)
                    if (
                        last.getDate() === now.getDate() &&
                        last.getHours() === hour &&
                        last.getMinutes() === minute
                    ) {
                        console.log(`Skip ID ${schedule.id}: already sent today at this time`)
                        continue
                    }
                }

                let shouldSend = false

                if (!schedule.is_recurring) {
                    if (scheduleDate <= now) shouldSend = true
                }

                if (schedule.recurring_type === "daily") {
                    shouldSend = true
                }

                if (
                    schedule.recurring_type === "weekly" &&
                    schedule.recurring_day === today
                ) {
                    shouldSend = true
                }

                if (
                    schedule.recurring_type === "working_days" &&
                    today >= 1 && today <= 5
                ) {
                    shouldSend = true
                }

                console.log(`ID ${schedule.id}: shouldSend=${shouldSend}, recurring_type=${schedule.recurring_type}, recurring_day=${schedule.recurring_day}, today=${today}, is_recurring=${schedule.is_recurring}`)

                if (!shouldSend) continue

                const formatTime = now.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                })

                let typeLabel = "One-time"

                if (schedule.recurring_type === "daily")
                    typeLabel = "Daily"

                if (schedule.recurring_type === "weekly")
                    typeLabel = "Weekly"

                if (schedule.recurring_type === "working_days")
                    typeLabel = "Working Days (Mon-Fri)"

                const formattedMessage = `
📅 *Schedule Notification*
────────────────
🕒 ${formatTime} WIB
🔁 ${typeLabel}
💬 ${schedule.message}
`

                await enqueueMessage(sock, schedule.group_id, {
                    text: formattedMessage.trim()
                })

                if (!schedule.is_recurring) {
                    await deactivate(schedule.id)
                } else {
                    await markSent(schedule.id)
                }
            }

        } catch (err) {
            console.error("Scheduler Error:", err)
        }
    })
}