import {
    handleMenu,
    handleTask,
} from "./commandHandlers.js"
import { handleReminder } from "../handler/reminderHandler.js"
import { handleDonate } from "../handler/donateHandler.js"
import { handleLogbook, processLogbookInteractiveReply } from "../handler/logbookHandler.js"
import { processReminderInteractiveReply } from "../handler/reminderHandler.js"
import { findGroup, createGroup } from "../repositories/groupRepository.js"
import { handleSchedule } from "../handler/scheduleHandler.js"
import { getPendingAction } from "../services/interactionService.js"

export async function routeMessage(context) {
    const { text, sock, groupId, msg } = context
    if (!context._buttonHandled) {
        const buttonResponse = msg?.message?.templateButtonReplyMessage
        if (buttonResponse?.selectedId) {
            context.text = buttonResponse.selectedId
            context._buttonHandled = true  // ✅ flag agar tidak loop

            const parts = context.text.trim().split(/\s+/)
            context.command = parts[0]?.startsWith("/") ? parts[0].slice(1).toLowerCase() : null
            context.args = parts.slice(1)

            return routeMessage(context)
        }

        const interactiveResponse = msg?.message?.interactiveResponseMessage
        if (interactiveResponse) {
            const paramsJson = interactiveResponse.nativeFlowResponseMessage?.paramsJson
            const buttonId = paramsJson
                ? JSON.parse(paramsJson).id
                : interactiveResponse.body?.text
            if (buttonId) {
                context.text = buttonId
                context._buttonHandled = true  // ✅ flag agar tidak loop
                return routeMessage(context)
            }
        }
    }

    if (!text) return

    // If user has a pending interactive action (e.g., logbook setup),
    // and message is NOT a command, forward to respective handler.
    const pending = await getPendingAction(context.sender)
    if (pending && !text.startsWith("/")) {
        // Only logbook interactive flows implemented for now
        if (pending.action && pending.action.startsWith("logbook_")) {
            return processLogbookInteractiveReply({ ...context, text }, pending)
        }

        if (pending.action && pending.action.startsWith("reminder_")) {
            return processReminderInteractiveReply({ ...context, text }, pending)
        }
    }

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
    const buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "Menu",
                id: "/menu",
            }),
        },
    ]

    const buttonMessage = {
        interactiveMessage: {
            title: "Command not found. Please use /menu to see available commands.",
            footer: 'Pilih pilihan di bawah untuk melihat menu.',
            buttons: buttons,
            headerType: 1
        }
    }
    if (!handler) {
        return sock.sendMessage(groupId, buttonMessage)
    }

    try {
        const existingGroup = await findGroup(context.groupId)

        if (!existingGroup) {
            await createGroup(context.groupId)
        }
        // Pass the modified context with the new text
        await handler({ ...context, text })
    } catch (error) {
        console.error("Command error:", error)

        await sock.sendMessage(groupId, {
            text: "⚠️ Something went wrong while processing your command."
        })
    }
}
