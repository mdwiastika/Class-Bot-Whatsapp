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
    pgm.createTable("user_credentials", {
        id: "id",
        jid_whatsapp: { type: "varchar(50)", notNull: true, unique: true },
        group_id: { type: "varchar(50)", notNull: true, references: "groups(group_id)", onDelete: "CASCADE" },
        email: { type: "varchar(255)", notNull: true },
        password: { type: "text", notNull: true },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    })

    pgm.createIndex("user_credentials", ["jid_whatsapp"]);
    pgm.createIndex("user_credentials", ["group_id"]);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("user_credentials");
};
