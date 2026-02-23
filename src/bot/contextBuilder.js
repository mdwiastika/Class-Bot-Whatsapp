export function buildContext(sock, msgWrapper) {

    const msg = msgWrapper.msg || msgWrapper

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
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
        reply: (message) =>
            sock.sendMessage(groupId, { text: message })
    }
}