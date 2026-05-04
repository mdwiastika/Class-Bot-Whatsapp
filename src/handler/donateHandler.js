import { buildDonateMenu } from "../utils/listMessageBuilder.js"
import { enqueueMessage } from "../services/messageQueue.js"

export async function handleDonate(context) {
    const { args, reply, sock, groupId } = context

    if (!args.length || !args[0]) {
        return await enqueueMessage(sock, groupId, buildDonateMenu())
    }

    const method = args[0].toLowerCase()

    if (method === "saweria") {
        return reply(`💳 SAWERIA DONATION`)
    }

    if (method === "trakteer") {
        return reply(`Coffee TRAKTEER.ID`)
    }

    if (method === "transfer") {
        return reply(`Bank TRANSFER Info`)
    }

    return await enqueueMessage(sock, groupId, buildDonateMenu())
}
