import { enqueueMessage } from "../services/messageQueue.js"
export async function handleMenu({ sock, groupId }) {
    await enqueueMessage(sock, groupId, {
        text: `
🎓 *CLASS MANAGER BOT*

━━━━━━━━━━━━━━━━━━

🔔 *Logbook Reminder*
   • /reminder add HH:MM
   • /reminder list
   • /reminder delete HH:MM
   • /reminder on HH:MM
   • /reminder off HH:MM

📝 *Class Tasks*
   • /task add Title | YYYY-MM-DD
   • /task list
   • /task delete ID

📅 *Class Schedule Menu*
────────────────────

➕ Add Schedule

• One-time
  /schedule YYYY-MM-DD HH:MM Message
  Example:
  /schedule 2026-02-25 08:00 Meeting

• Daily
  /schedule daily HH:MM Message
  Example:
  /schedule daily 08:00 Good morning

• Weekly
  /schedule weekly monday HH:MM Message
  Example:
  /schedule weekly monday 09:00 Weekly report

  (Available days:
   sunday, monday, tuesday,
   wednesday, thursday, friday, saturday)

• Working Days (Monday–Friday)
  /schedule working HH:MM Message
  Example:
  /schedule working 08:00 Standup

────────────────────
📋 View Schedules
  /schedule list

🗑 Delete Schedule
  /schedule delete ID
  Example:
  /schedule delete 3

💖 *Support*
   • /donate

━━━━━━━━━━━━━━━━━━
ℹ️ Type /menu anytime to see this menu again.
`
    })
}

export async function handleTask({ sock, groupId }) {
    await enqueueMessage(sock, groupId, {
        text: "Task feature coming soon."
    })
}

export async function handleSchedule({ sock, groupId }) {
    await enqueueMessage(sock, groupId, {
        text: "Schedule feature coming soon."
    })
}
