import {
    handleMenu,
    handleTask,
} from "./commandHandlers.js"
import { handleReminder } from "../handler/reminderHandler.js"
import { handleDonate } from "../handler/donateHandler.js"
import { handleLogbook } from "../handler/logbookHandler.js"
import { findGroup, createGroup } from "../repositories/groupRepository.js"
import { handleSchedule } from "../handler/scheduleHandler.js"

export async function routeMessage(context) {
    const { text, sock, groupId } = context

    if (!text) return
    if (!text.startsWith("/")) return

    const parts = text.trim().split(/\s+/)
    const command = parts[0].toLowerCase()

    const routes = {
        "/menu": handleMenu,

        "/reminder": handleReminder,
        "/pengingat": handleReminder,

        "/logbook": handleLogbook,
        "/log": handleLogbook,

        "/task": handleTask,
        "/tugas": handleTask,
        "/tasks": handleTask,

        "/schedule": handleSchedule,
        "/jadwal": handleSchedule,

        "/donate": handleDonate,
        "/donation": handleDonate,
        "/donasi": handleDonate,
    }

    const handler = routes[command]

    if (!handler) {
        return sock.sendMessage(groupId, {
            text: `❌ Unknown command.\nType /menu to see available commands.`
        })
    }

    try {
        const existingGroup = await findGroup(context.groupId)

        if (!existingGroup) {
            await createGroup(context.groupId)
        }
        await handler(context)
    } catch (error) {
        console.error("Command error:", error)

        await sock.sendMessage(groupId, {
            text: "⚠️ Something went wrong while processing your command."
        })
    }
}