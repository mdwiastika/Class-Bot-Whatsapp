/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
    pgm.createTable("schedule_messages", {
        id: {
            type: "serial",
            primaryKey: true,
        },

        group_id: {
            type: "text",
            notNull: true,
        },

        message: {
            type: "text",
            notNull: true,
        },

        schedule_time: {
            type: "timestamp",
            notNull: true,
        },

        is_recurring: {
            type: "boolean",
            default: false,
        },

        recurring_type: {
            type: "varchar(20)",
        },
        // daily | weekly | working_days

        recurring_day: {
            type: "integer",
        },
        // 0-6 (dipakai kalau weekly)

        is_active: {
            type: "boolean",
            default: true,
        },

        last_sent_at: {
            type: "timestamp",
        },

        created_at: {
            type: "timestamp",
            default: pgm.func("current_timestamp"),
        },

        updated_at: {
            type: "timestamp",
            default: pgm.func("current_timestamp"),
        },
    });

    pgm.createIndex(
        "schedule_messages",
        ["is_active", "schedule_time"],
        { name: "schedule_messages_idx_schedule_active_time" }
    );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
    pgm.dropIndex("schedule_messages", ["is_active", "schedule_time"], {
        name: "schedule_messages_idx_schedule_active_time",
        ifExists: true
    });
    pgm.dropTable("schedule_messages");
};