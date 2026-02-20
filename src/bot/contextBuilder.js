export function buildContext(sock, msg) {
    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ""

    const groupId = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const userNumber = sender.split("@")[0]

    return {
        sock,
        text,
        groupId,
        sender,
        userNumber
    }
}
