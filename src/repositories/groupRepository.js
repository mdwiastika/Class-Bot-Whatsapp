import pool from "../config/db.js"

export async function createGroup(groupId, className) {
    return pool.query(
        `INSERT INTO groups (group_id, class_name)
     VALUES ($1, $2)
     ON CONFLICT (group_id) DO NOTHING`,
        [groupId, className]
    )
}

export async function findGroupByGroupId(groupId) {
    const result = await pool.query(
        `SELECT * FROM groups WHERE group_id = $1`,
        [groupId]
    )
    return result.rows[0]
}
