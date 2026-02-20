import pool from "../config/db.js"

export async function findGroup(groupId) {
    const result = await pool.query(
        `SELECT * FROM groups WHERE group_id = $1`,
        [groupId]
    )
    return result.rows[0]
}

export async function createGroup(groupId) {
    return pool.query(
        `
        INSERT INTO groups (group_id, class_name)
        VALUES ($1, 'Unknown Class')
        ON CONFLICT (group_id) DO NOTHING
        `,
        [groupId]
    )
}