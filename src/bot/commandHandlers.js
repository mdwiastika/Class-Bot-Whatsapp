import { enqueueMessage } from "../services/messageQueue.js"
import {
  buildMainMenu,
  buildLogbookMenu,
  buildReminderMenu,
  buildScheduleMenu,
  buildDonateMenu
} from "../utils/listMessageBuilder.js"

export async function handleMenu({ sock, groupId, args }) {
  const submenu = args[0]?.toLowerCase()

  if (!submenu) {
    return await enqueueMessage(sock, groupId, buildMainMenu())
  }

  if (submenu === "logbook") {
    return await enqueueMessage(sock, groupId, buildLogbookMenu())
  }

  if (submenu === "reminder") {
    return await enqueueMessage(sock, groupId, buildReminderMenu())
  }

  if (submenu === "task") {
    return await enqueueMessage(sock, groupId, {
      text: "📝 TASK HELP\n\nStatus: Coming soon..."
    })
  }

  if (submenu === "schedule") {
    return await enqueueMessage(sock, groupId, buildScheduleMenu())
  }

  if (submenu === "donate") {
    return await enqueueMessage(sock, groupId, buildDonateMenu())
  }

  return await enqueueMessage(sock, groupId, {
    text: "❌ Unknown submenu!\n\nTry: /menu logbook, /menu reminder, /menu task, /menu schedule, /menu donate"
  })
}

export async function handleTask({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: "📝 QUICK HELP\n\nType: /menu task\nfor detailed commands"
  })
}

export async function handleSchedule({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: "📅 QUICK HELP\n\nType: /menu schedule\nfor detailed commands"
  })
}
