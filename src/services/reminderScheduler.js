import cron from "node-cron"
import pool from "../config/db.js"

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

                await sock.sendMessage(row.group_id, {
                    text: `🔔 @${row.user_number} jangan lupa isi logbook ya 👀`,
                    mentions: [`${row.user_number}@s.whatsapp.net`]
                })

                // Delay kecil biar aman dari spam detection
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

        } catch (error) {
            console.error("Reminder Scheduler Error:", error)
        }
    })
}