import cron from "node-cron"
import { getBackupTime, runBackupAndSend } from "./backupService.js"

let lastBackupDate = null

/**
 * Starts the database backup scheduler.
 * Runs every minute to check if the current time matches the configured backup time.
 * @param {object} sock - Baileys socket object
 */
export function startBackupScheduler(sock) {
    console.log("⚙️ Starting Database Backup Scheduler...")
    
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date()
            const currentTime = now.toTimeString().slice(0, 5) // Format: "HH:MM"
            const currentDateStr = now.toDateString() // Format: "Day Mon Date Year"

            const scheduledTime = await getBackupTime()

            if (scheduledTime === currentTime && lastBackupDate !== currentDateStr) {
                lastBackupDate = currentDateStr
                console.log(`⏰ Scheduled backup triggered at ${currentTime}`)
                await runBackupAndSend(sock)
            }
        } catch (error) {
            console.error("❌ Backup Scheduler Error:", error)
        }
    })
}
