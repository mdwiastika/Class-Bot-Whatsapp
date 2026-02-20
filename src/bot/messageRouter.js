import {
    handleMenu,
    handleTask,
    handleSchedule
} from "./commandHandlers.js"
import { handleReminder } from "../handler/reminderHandler.js"
import { handleDonate } from "../handler/donateHandler.js"

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
        await handler(context)
    } catch (error) {
        console.error("Command error:", error)

        await sock.sendMessage(groupId, {
            text: "⚠️ Something went wrong while processing your command."
        })
    }
}