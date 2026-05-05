import cron from "node-cron"
import { getActiveSchedules, markSent, deactivate } from "./scheduleService.js"
import { enqueueMessage } from "./messageQueue.js"

const EVERY_MINUTE = "* * * * *"

const WEEKDAYS = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
    THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
}

const RECURRENCE = {
    DAILY: "daily",
    WEEKLY: "weekly",
    WORKING_DAYS: "working_days",
}

function isTimeMatched(scheduledTime, currentHour, currentMinute) {
    return scheduledTime.getHours() === currentHour &&
           scheduledTime.getMinutes() === currentMinute
}

function isAlreadySentThisMinute(schedule, now) {
    if (!schedule.last_sent_at) return false
    
    const lastSent = new Date(schedule.last_sent_at)
    return lastSent.getDate() === now.getDate() &&
           lastSent.getHours() === now.getHours() &&
           lastSent.getMinutes() === now.getMinutes()
}

function isWorkingDay(dayOfWeek) {
    return dayOfWeek >= WEEKDAYS.MONDAY && dayOfWeek <= WEEKDAYS.FRIDAY
}

function matchesRecurrenceRule(schedule, now) {
    const dayOfWeek = now.getDay()
    const scheduledTime = new Date(schedule.schedule_time)
    
    if (!schedule.is_recurring) {
        return scheduledTime <= now
    }
    
    switch (schedule.recurring_type) {
        case RECURRENCE.DAILY:
            return true
        case RECURRENCE.WEEKLY:
            return schedule.recurring_day === dayOfWeek
        case RECURRENCE.WORKING_DAYS:
            return isWorkingDay(dayOfWeek)
        default:
            return false
    }
}

export function shouldTriggerNow(schedule, now) {
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    const scheduledTime = new Date(schedule.schedule_time)
    if (!isTimeMatched(scheduledTime, hour, minute)) return false
    
    if (isAlreadySentThisMinute(schedule, now)) return false
    
    return matchesRecurrenceRule(schedule, now)
}

function getRecurrenceLabel(type) {
    const labels = {
        [RECURRENCE.DAILY]: "☀️  Setiap Hari",
        [RECURRENCE.WEEKLY]: "📍 Mingguan",
        [RECURRENCE.WORKING_DAYS]: "💼 Hari Kerja (Sen-Jum)"
    }
    return labels[type] || "⏱️  One-Time"
}

function formatScheduleMessage(schedule, now) {
    const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    const typeLabel = getRecurrenceLabel(schedule.recurring_type)
    
    return `📅 *Schedule Notification*
──────────
🕒 ${time} WIB
🔁 ${typeLabel}
💬 ${schedule.message}`
}

export function startGlobalScheduler(sock) {
    cron.schedule(EVERY_MINUTE, async () => {
        try {
            const schedules = await getActiveSchedules()
            const now = new Date()
            
            for (const schedule of schedules) {
                if (!shouldTriggerNow(schedule, now)) continue
                
                const message = formatScheduleMessage(schedule, now)
                await enqueueMessage(sock, schedule.group_id, { text: message })
                
                schedule.is_recurring ? await markSent(schedule.id) : await deactivate(schedule.id)
            }
        } catch (err) {
            console.error("❌ Scheduler Error:", err.message)
        }
    })
}
