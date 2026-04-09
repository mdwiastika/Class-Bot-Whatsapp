import pool from "../config/db.js"

export async function saveUserCredentials(jidWhatsapp, groupId, email, password) {
    const result = await pool.query(
        `
        INSERT INTO user_credentials (jid_whatsapp, group_id, email, password)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (jid_whatsapp) 
        DO UPDATE SET email = $3, password = $4, updated_at = NOW()
        RETURNING *
        `,
        [jidWhatsapp, groupId, email, password]
    )
    return result.rows[0]
}

export async function getUserCredentials(jidWhatsapp) {
    const result = await pool.query(
        `
        SELECT * FROM user_credentials 
        WHERE jid_whatsapp = $1
        `,
        [jidWhatsapp]
    )
    return result.rows[0]
}

export async function deleteUserCredentials(jidWhatsapp) {
    return pool.query(
        `
        DELETE FROM user_credentials 
        WHERE jid_whatsapp = $1
        `,
        [jidWhatsapp]
    )
}

export async function getUserCredentialsByGroup(groupId) {
    const result = await pool.query(
        `
        SELECT * FROM user_credentials 
        WHERE group_id = $1
        ORDER BY created_at DESC
        `,
        [groupId]
    )
    return result.rows
}
