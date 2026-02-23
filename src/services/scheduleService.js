import pool from "../config/db.js"

export async function createSchedule(data) {
    const {
        groupId,
        message,
        scheduleTime,
        recurringType = null,
        recurringDay = null
    } = data

    const result = await pool.query(
        `
        INSERT INTO schedule_messages
        (group_id, message, schedule_time, is_recurring, recurring_type, recurring_day)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            groupId,
            message,
            scheduleTime,
            !!recurringType,
            recurringType,
            recurringDay
        ]
    )

    return result.rows[0]
}

export async function listSchedules(groupId) {
    const result = await pool.query(
        `
        SELECT id, message, schedule_time, recurring_type
        FROM schedule_messages
        WHERE group_id = $1
          AND is_active = true
        ORDER BY schedule_time ASC
        `,
        [groupId]
    )

    return result.rows
}

export async function deleteSchedule(id, groupId) {
    await pool.query(
        `
        UPDATE schedule_messages
        SET is_active = false
        WHERE id = $1
          AND group_id = $2
        `,
        [id, groupId]
    )
}

export async function getActiveSchedules() {
    const result = await pool.query(
        `SELECT * FROM schedule_messages WHERE is_active = true`
    )
    return result.rows
}

export async function markSent(id) {
    await pool.query(
        `UPDATE schedule_messages SET last_sent_at = NOW() WHERE id = $1`,
        [id]
    )
}

export async function deactivate(id) {
    await pool.query(
        `UPDATE schedule_messages SET is_active = false WHERE id = $1`,
        [id]
    )
}