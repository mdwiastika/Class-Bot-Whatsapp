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
            const schedules = await getActiveSchedules()

            const now = new Date()
            const today = now.getDay()
            const hour = now.getHours()
            const minute = now.getMinutes()

            for (const schedule of schedules) {

                const scheduleDate = new Date(schedule.schedule_time)

                if (scheduleDate.getHours() !== hour || scheduleDate.getMinutes() !== minute) {
                    continue
                }

                if (schedule.last_sent_at) {
                    const last = new Date(schedule.last_sent_at)
                    if (
                        last.getDate() === now.getDate() &&
                        last.getHours() === hour &&
                        last.getMinutes() === minute
                    ) {
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