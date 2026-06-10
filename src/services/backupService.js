import fs from "fs"
import path from "path"
import { exec } from "child_process"
import util from "util"
import pool from "../config/db.js"

const execPromise = util.promisify(exec)

let cachedAdminJid = null

/**
 * Resolves the phone number from .env into the WhatsApp JID/LID format dynamically.
 * Caches the result in memory to avoid repeated queries.
 * @param {object} sock - Baileys socket object
 * @returns {Promise<string>}
 */
export async function getAdminJid(sock) {
    if (cachedAdminJid) return cachedAdminJid

    const backupPhone = process.env.BACKUP_PHONE_NUMBER
    if (!backupPhone) {
        console.warn("⚠️ BACKUP_PHONE_NUMBER is not defined in .env")
        return null
    }

    let cleanPhone = backupPhone.trim().replace(/\D/g, "")
    if (cleanPhone.startsWith("0")) {
        cleanPhone = "62" + cleanPhone.slice(1)
    }

    try {
        console.log(`[Backup Auth] Resolving admin JID for phone: ${cleanPhone}...`)
        const [result] = await sock.onWhatsApp(cleanPhone)
        if (result && result.exists) {
            cachedAdminJid = result.jid
            console.log(`[Backup Auth] Resolved admin JID: ${cachedAdminJid}`)
            return cachedAdminJid
        }
    } catch (error) {
        console.error("[Backup Auth] Error resolving admin JID via onWhatsApp:", error)
    }

    // Fallback if lookup fails or bot is not connected yet
    return `${cleanPhone}@s.whatsapp.net`
}

/**
 * Gets the current backup time from settings.
 * Defaults to "23:50" if not configured.
 * @returns {Promise<string>}
 */
export async function getBackupTime() {
    try {
        const result = await pool.query(
            "SELECT value FROM backup_settings WHERE key = 'backup_time' LIMIT 1"
        )
        if (result.rows.length > 0) {
            return result.rows[0].value
        }
    } catch (error) {
        console.error("Error fetching backup_time from database:", error)
    }
    return "23:50"
}

/**
 * Updates the backup time in settings.
 * @param {string} time - Time in HH:MM format
 * @returns {Promise<boolean>}
 */
export async function updateBackupTime(time) {
    try {
        await pool.query(
            `INSERT INTO backup_settings (key, value, updated_at)
             VALUES ('backup_time', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [time]
        )
        return true
    } catch (error) {
        console.error("Error updating backup_time in database:", error)
        return false
    }
}

/**
 * Runs pg_dumpall, individual pg_dumps, zips them into two folders, sends to admin, and cleans up.
 * @param {object} sock - Baileys socket object
 * @returns {Promise<void>}
 */
export async function runBackupAndSend(sock) {
    const adminJid = await getAdminJid(sock)
    if (!adminJid) {
        throw new Error("Admin JID could not be resolved. Verify BACKUP_PHONE_NUMBER in .env")
    }

    const dbUrlStr = process.env.DATABASE_URL
    if (!dbUrlStr) {
        console.error("❌ DATABASE_URL is not defined in .env")
        throw new Error("DATABASE_URL is not configured.")
    }

    const tempDir = path.join(process.cwd(), "temp_backups")
    const allDbDir = path.join(tempDir, "all_db_backup")
    const indDbDir = path.join(tempDir, "individual_backups")
    
    // Clean up any old temp directory and recreate
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
    }
    fs.mkdirSync(allDbDir, { recursive: true })
    fs.mkdirSync(indDbDir, { recursive: true })

    const now = new Date()
    const pad = (n) => String(n).padStart(2, "0")
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const timestamp = `${dateStr}_${timeStr}`

    const sqlAllPath = path.join(allDbDir, "all_databases.sql")
    const zipPath = path.join(process.cwd(), `db_backup_${timestamp}.zip`)

    try {
        // Parse DATABASE_URL
        const dbUrl = new URL(dbUrlStr)
        const username = dbUrl.username
        const password = decodeURIComponent(dbUrl.password)
        const host = dbUrl.hostname
        const port = dbUrl.port || 5432

        console.log(`Starting pg_dumpall to: ${sqlAllPath}`)
        // 1. Run pg_dumpall
        const dumpAllCommand = `pg_dumpall -U "${username}" -h "${host}" -p "${port}" -f "${sqlAllPath}"`
        await execPromise(dumpAllCommand, {
            env: { ...process.env, PGPASSWORD: password }
        })

        // 2. Query all active databases and run pg_dump individually
        console.log("Querying list of databases...")
        const dbResult = await pool.query(
            "SELECT datname FROM pg_database WHERE datistemplate = false AND datallowconn = true"
        )
        const databases = dbResult.rows.map(row => row.datname)
        console.log(`Databases to dump: ${databases.join(", ")}`)

        for (const dbName of databases) {
            const sqlIndPath = path.join(indDbDir, `${dbName}.sql`)
            console.log(`Dumping database: ${dbName} -> ${sqlIndPath}`)
            const dumpIndCommand = `pg_dump -U "${username}" -h "${host}" -p "${port}" -d "${dbName}" -f "${sqlIndPath}"`
            await execPromise(dumpIndCommand, {
                env: { ...process.env, PGPASSWORD: password }
            })
        }

        // 3. Zip both folders relative to tempDir
        console.log(`Zipping folders into: ${zipPath}`)
        const zipCommand = `zip -r "${zipPath}" all_db_backup individual_backups`
        await execPromise(zipCommand, { cwd: tempDir })

        console.log(`Sending zip backup to: ${adminJid}`)
        // 4. Send ZIP via WhatsApp
        const fileName = `db_backup_${timestamp}.zip`
        const localDate = now.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const localTime = now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        await sock.sendMessage(adminJid, {
            document: { url: zipPath },
            fileName: fileName,
            mimetype: "application/zip",
            caption: `📦 *BACKUP DATABASE SERVER*
            
📅 Hari/Tanggal: ${localDate}
🕒 Waktu: ${localTime} WIB
⚙️ Status: Success ✅

_Zip file ini berisi:_
1. Folder \`all_db_backup\` (gabungan seluruh database)
2. Folder \`individual_backups\` (terpisah per database)`
        })

        console.log("Database backup sent successfully!")

    } catch (error) {
        console.error("❌ Error running database backup:", error)
        try {
            await sock.sendMessage(adminJid, {
                text: `⚠️ *BACKUP DATABASE SERVER GAGAL*
                
📅 Waktu: ${now.toLocaleString("id-ID")}
❌ Error: ${error.message}`
            })
        } catch (msgErr) {
            console.error("Failed to send error notification:", msgErr)
        }
        throw error
    } finally {
        // Clean up temp backups directory and ZIP file
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true })
                console.log(`Cleaned up temp backups directory: ${tempDir}`)
            }
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath)
                console.log(`Cleaned up temp ZIP file: ${zipPath}`)
            }
        } catch (cleanupError) {
            console.error("Error during files cleanup:", cleanupError)
        }
    }
}
