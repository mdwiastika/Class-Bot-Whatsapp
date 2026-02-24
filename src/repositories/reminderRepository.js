import pool from "../config/db.js"

export async function createReminder(groupId, userNumber, time) {
    return pool.query(
        `
        INSERT INTO reminder_logbooks 
        (group_id, user_number, reminder_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_number, group_id, reminder_time) DO NOTHING
        `,
        [groupId, userNumber, time]
    )
}

export async function getReminders(groupId, userNumber) {
    const result = await pool.query(
        `
        SELECT reminder_time, is_active
        FROM reminder_logbooks
        WHERE group_id = $1
          AND user_number = $2
        ORDER BY reminder_time
        `,
        [groupId, userNumber]
    )

    return result.rows
}

export async function deleteReminder(groupId, userNumber, time) {
    return pool.query(
        `
        DELETE FROM reminder_logbooks
        WHERE group_id = $1
          AND user_number = $2
          AND reminder_time = $3
        `,
        [groupId, userNumber, time]
    )
}

export async function toggleReminder(groupId, userNumber, time, status) {
    return pool.query(
        `
        UPDATE reminder_logbooks
        SET is_active = $4
        WHERE group_id = $1
          AND user_number = $2
          AND reminder_time = $3
        `,
        [groupId, userNumber, time, status]
    )
}