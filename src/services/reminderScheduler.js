import cron from "node-cron"
import pool from "../config/db.js"
import { enqueueMessage } from "./messageQueue.js"
import { getRandomReminder } from "../utils/reminderMessage.js"

export function startReminderScheduler(sock) {

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date()
            const currentTime = now.toTimeString().slice(0, 5)

            const result = await pool.query(
                `
                SELECT group_id, user_number
                FROM reminder_logbooks
                WHERE reminder_time = $1
                  AND is_active = true
                `,
                [currentTime]
            )

            if (result.rows.length === 0) return

            for (const row of result.rows) {
                const randomText = getRandomReminder()
                await enqueueMessage(sock, row.group_id, {
                    text: `🔔 @${row.user_number} ${randomText}`,
                    mentions: [`${row.user_number}@s.whatsapp.net`]
                })
            }

        } catch (error) {
            console.error("Reminder Scheduler Error:", error)
        }
    })
}