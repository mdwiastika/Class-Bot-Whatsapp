/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable("groups", {
        id: "id",
        group_id: { type: "varchar(50)", notNull: true, unique: true },
        class_name: { type: "varchar(100)", notNull: true },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    })
    pgm.createTable("group_members", {
        id: "id",
        group_id: { type: "varchar(50)", notNull: true, references: "groups(group_id)", onDelete: "CASCADE" },
        user_number: { type: "varchar(17)", notNull: true },
        role: { type: "varchar(20)", notNull: true, default: "member" },
        joined_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    })

    pgm.createTable("reminder_logbooks", {
        id: "id",
        user_number: { type: "varchar(17)", notNull: true },
        group_id: { type: "varchar(50)", notNull: true, references: "groups(group_id)", onDelete: "CASCADE" },
        reminder_time: { type: "time", notNull: true },
        is_active: { type: "boolean", notNull: true, default: true },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    })

    pgm.createTable("tasks", {
        id: "id",
        group_id: { type: "varchar(50)", notNull: true, references: "groups(group_id)", onDelete: "CASCADE" },
        title: { type: "varchar(100)", notNull: true },
        description: { type: "text", notNull: false },
        deadline: { type: "date", notNull: true },
    });

    pgm.createTable("class_schedules", {
        id: "id",
        group_id: { type: "varchar(50)", notNull: true, references: "groups(group_id)", onDelete: "CASCADE" },
        course_name: { type: "varchar(100)", notNull: true },
        day: { type: "varchar(20)", notNull: true },
        start_time: { type: "time", notNull: true },
        end_time: { type: "time", notNull: true },
        lecturer: { type: "varchar(100)", notNull: true },
    })

    pgm.addConstraint("group_members", "unique_member_per_group", {
        unique: ["group_id", "user_number"]
    });

    pgm.addConstraint("reminder_logbooks", "unique_reminder_per_time", {
        unique: ["user_number", "group_id", "reminder_time"]
    });

    pgm.createIndex("reminder_logbooks", ["reminder_time"]);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("class_schedules");
    pgm.dropTable("tasks");
    pgm.dropTable("reminder_logbooks");
    pgm.dropTable("group_members");
    pgm.dropTable("groups");
};
