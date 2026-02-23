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

📅 *Class Schedule*
   • /schedule add Course | Day | HH:MM
   • /schedule list
   • /schedule delete ID
   *Schedule format:*
    • One-time:
      /schedule 2026-02-25 08:00 Meeting
    • Daily:
      /schedule daily 08:00 Good morning
    • Weekly:
      /schedule weekly monday 09:00 Weekly report
    • Working days:
      /schedule working 08:00 Standup

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
