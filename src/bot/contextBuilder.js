export function buildContext(sock, msgWrapper) {

    const msg = msgWrapper.msg || msgWrapper
    const content = extractMessageContent(msg.message || {})

    const text =
        content.conversation ||
        content.extendedTextMessage?.text ||
        ""

    const groupId = msg.key.remoteJid
    const isGroup = groupId?.endsWith("@g.us")

    let senderJid = null

    if (isGroup) {
        senderJid =
            msg.key.participantAlt ||
            msg.key.participant ||
            null
    } else {
        senderJid = msg.key.remoteJid
    }

    const userNumber = senderJid
        ? senderJid.split("@")[0].split(":")[0]
        : ""

    const parts = text.trim().split(/\s+/)
    const command = parts[0]?.startsWith("/")
        ? parts[0].slice(1).toLowerCase()
        : null

    const args = parts.slice(1)

    const selectedRowId =
        content.listResponseMessage?.singleSelectReply?.selectedRowId ||
        content.buttonsResponseMessage?.selectedButtonId ||
        content.templateButtonReplyMessage?.selectedId ||
        extractInteractiveSelectionId(content) ||
        null

    return {
        sock,
        text,
        groupId,
        chatId: groupId,
        sender: senderJid,
        userNumber,
        isGroup,
        command,
        args,
        selectedRowId,
        reply: (message) =>
            sock.sendMessage(groupId, { text: message })
    }
}

function extractMessageContent(message) {
    let current = message

    while (current) {
        if (current.ephemeralMessage?.message) {
            current = current.ephemeralMessage.message
            continue
        }

        if (current.viewOnceMessage?.message) {
            current = current.viewOnceMessage.message
            continue
        }

        if (current.viewOnceMessageV2?.message) {
            current = current.viewOnceMessageV2.message
            continue
        }

        if (current.viewOnceMessageV2Extension?.message) {
            current = current.viewOnceMessageV2Extension.message
            continue
        }

        break
    }

    return current || {}
}

function extractInteractiveSelectionId(content) {
    const paramsJson = content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
    if (!paramsJson) return null

    try {
        const parsed = JSON.parse(paramsJson)
        return parsed.id || parsed.selectedRowId || parsed.rowId || null
    } catch {
        return null
    }
}
