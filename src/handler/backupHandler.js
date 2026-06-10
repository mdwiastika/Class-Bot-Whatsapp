import { getBackupTime, updateBackupTime, runBackupAndSend } from "../services/backupService.js"

/**
 * Handles the /backup command to trigger database backup manually.
 */
export async function handleBackupNow({ sock, groupId }) {
    let sent = null
    try {
        sent = await sock.sendMessage(groupId, { text: "⏳ Sedang memproses backup database server..." })
        await runBackupAndSend(sock)
        if (sent) {
            await sock.sendMessage(groupId, {
                text: "✅ Backup database all di server berhasil diproses dan dikirim ke chat pribadi Anda.",
                edit: sent.key
            })
        }
    } catch (error) {
        console.error("Manual Backup Command Error:", error)
        if (sent) {
            await sock.sendMessage(groupId, {
                text: `❌ Gagal melakukan backup database: ${error.message}`,
                edit: sent.key
            })
        } else {
            await sock.sendMessage(groupId, { text: `❌ Gagal melakukan backup database: ${error.message}` })
        }
    }
}

/**
 * Handles the /setbackup HH:MM command to update backup schedule.
 */
export async function handleSetBackupTime({ sock, groupId, args }) {
    const time = args[0]
    if (!time) {
        return sock.sendMessage(groupId, { text: "❌ Perintah salah. Contoh penggunaan: `/setbackup 23:50`" })
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(time)) {
        return sock.sendMessage(groupId, { text: "❌ Format waktu tidak valid. Gunakan format 24 jam (HH:MM). Contoh: `23:50`" })
    }

    try {
        const success = await updateBackupTime(time)
        if (success) {
            await sock.sendMessage(groupId, { text: `✅ Waktu backup database server berhasil diubah menjadi: *${time}* WIB.` })
        } else {
            await sock.sendMessage(groupId, { text: "❌ Gagal memperbarui jadwal backup di database." })
        }
    } catch (error) {
        console.error("Set Backup Time Error:", error)
        await sock.sendMessage(groupId, { text: `❌ Terjadi kesalahan: ${error.message}` })
    }
}

/**
 * Handles the /backuptime command to check the current backup schedule.
 */
export async function handleGetBackupTime({ sock, groupId }) {
    try {
        const time = await getBackupTime()
        await sock.sendMessage(groupId, { text: `🕒 Jadwal backup database server saat ini: *${time}* WIB.` })
    } catch (error) {
        console.error("Get Backup Time Error:", error)
        await sock.sendMessage(groupId, { text: `❌ Terjadi kesalahan saat mengambil jadwal backup: ${error.message}` })
    }
}
