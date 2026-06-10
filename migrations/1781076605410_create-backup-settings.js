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
    pgm.createTable("backup_settings", {
        key: { type: "varchar(50)", notNull: true, primaryKey: true },
        value: { type: "text", notNull: true },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    })

    // Seed default backup time
    pgm.sql("INSERT INTO backup_settings (key, value) VALUES ('backup_time', '23:50') ON CONFLICT DO NOTHING;")
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("backup_settings")
};
