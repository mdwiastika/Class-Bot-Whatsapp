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

    console.log("Final sender:", senderJid)

    return {
        sock,
        text,
        groupId,
        sender: senderJid,
        userNumber,
        isGroup
    }
}