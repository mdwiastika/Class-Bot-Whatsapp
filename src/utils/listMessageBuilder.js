/**
 * Build a WhatsApp list message with interactive sections and rows
 * @param {string} header - Main message text (required)
 * @param {Array} sections - Array of section objects with title and rows
 * @param {string} footer - Footer text (optional)
 * @param {string} buttonText - Text on the "View options" button (default: "Choose an option")
 * @returns {Object} Formatted list message object for Baileys
 * @example
 * const sections = [
 *   {
 *     title: "Actions",
 *     rows: [
 *       { rowId: "action-1", title: "Option 1", description: "Desc 1" },
 *       { rowId: "action-2", title: "Option 2", description: "Desc 2" }
 *     ]
 *   }
 * ];
 * const msg = buildListMessage("Choose action:", sections, "Footer", "Select");
 */
export function buildListMessage(header, sections, footer = "", buttonText = "📋 Choose an option") {
    if (!header || !sections || !Array.isArray(sections)) {
        throw new Error("buildListMessage requires header (string) and sections (array)");
    }

    return {
        text: header,
        footer: footer || undefined,
        title: "Menu",
        buttonText: buttonText,
        sections: sections
    };
}

/**
 * Build a single section with rows (helper for easier section creation)
 * @param {string} title - Section title
 * @param {Array} rows - Array of row objects
 * @returns {Object} Section object
 * @example
 * const section = buildSection("Commands", [
 *   { rowId: "cmd-1", title: "Start", description: "Begin process" }
 * ]);
 */
export function buildSection(title, rows) {
    if (!title || !Array.isArray(rows)) {
        throw new Error("buildSection requires title (string) and rows (array)");
    }

    return {
        title: title,
        rows: rows
    };
}

/**
 * Build a single row for a list message section
 * @param {string} rowId - Unique identifier for this row (what bot receives when clicked)
 * @param {string} title - Row title (main text)
 * @param {string} description - Row description (secondary text, optional)
 * @returns {Object} Row object
 * @example
 * const row = buildRow("logbook-fill", "✍️ Isi Logbook", "Mulai isi logbook baru");
 */
export function buildRow(rowId, title, description = "") {
    if (!rowId || !title) {
        throw new Error("buildRow requires rowId (string) and title (string)");
    }

    return {
        rowId: rowId,
        title: title,
        description: description || undefined
    };
}

/**
 * Main menu list message - Shows all available features
 * @returns {Object} Formatted list message for main menu
 */
export function buildMainMenu() {
    return buildListMessage(
        "╔═══════════════════════╗\n║  🎓 CLASS MANAGER BOT ║\n╚═══════════════════════╝\n\n✨ *Pilih Fitur yang Kamu Butuhkan:*",
        [
            buildSection("📚 Features", [
                buildRow("menu-logbook", "📖 Logbook", "Isi logbook via WhatsApp"),
                buildRow("menu-reminder", "🔔 Reminder", "Atur pengingat logbook otomatis"),
                buildRow("menu-task", "📝 Task", "Kelola tugas & deadline kelas"),
                buildRow("menu-schedule", "📅 Schedule", "Jadwalkan pesan berkala"),
                buildRow("menu-donate", "💖 Donate", "Dukung pengembang")
            ])
        ],
        "💬 Tap on an option above",
        "👇 View Features"
    );
}

/**
 * Logbook menu list message
 * @returns {Object} Formatted list message for logbook menu
 */
export function buildLogbookMenu() {
    return buildListMessage(
        "📖 *LOGBOOK MENU*\n\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Logbook Actions", [
                buildRow("logbook-fill", "✍️ Isi Logbook", "Mulai isi logbook baru"),
                buildRow("logbook-info", "ℹ️ Info Logbook", "Lihat petunjuk pengisian"),
                buildRow("logbook-matkul", "📚 Daftar Mata Kuliah", "Lihat mata kuliah yang tersedia")
            ])
        ],
        "Tap an option to continue",
        "📖 Choose Action"
    );
}

/**
 * Reminder menu list message
 * @returns {Object} Formatted list message for reminder menu
 */
export function buildReminderMenu() {
    return buildListMessage(
        "🔔 *REMINDER MENU*\n\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Reminder Actions", [
                buildRow("reminder-create", "➕ Buat Reminder", "Atur pengingat logbook baru"),
                buildRow("reminder-list", "📋 Lihat Reminders", "Tampilkan semua reminder aktif"),
                buildRow("reminder-delete", "🗑️ Hapus Reminder", "Hapus reminder yang ada"),
                buildRow("reminder-toggle", "🔄 Aktifkan/Nonaktifkan", "Ubah status reminder")
            ])
        ],
        "Tap an option to continue",
        "🔔 Choose Action"
    );
}

/**
 * Schedule menu list message
 * @returns {Object} Formatted list message for schedule menu
 */
export function buildScheduleMenu() {
    return buildListMessage(
        "📅 *SCHEDULE MENU*\n\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Schedule Actions", [
                buildRow("schedule-create", "➕ Buat Jadwal", "Buat jadwal pengiriman pesan baru"),
                buildRow("schedule-list", "📋 Lihat Jadwal", "Tampilkan semua jadwal aktif"),
                buildRow("schedule-delete", "🗑️ Hapus Jadwal", "Hapus jadwal yang ada")
            ])
        ],
        "Tap an option to continue",
        "📅 Choose Action"
    );
}

/**
 * Donate menu list message
 * @returns {Object} Formatted list message for donation
 */
export function buildDonateMenu() {
    return buildListMessage(
        "💖 *DONATE*\n\nTerima kasih atas dukunganmu! Pilih cara untuk mendukung:",
        [
            buildSection("Donation Methods", [
                buildRow("donate-saweria", "💳 Saweria", "Donasi via Saweria"),
                buildRow("donate-trakteer", "☕ Trakteer", "Donasi via Trakteer.id"),
                buildRow("donate-transfer", "🏦 Transfer Bank", "Informasi transfer bank")
            ])
        ],
        "❤️ Tap to support the dev",
        "💖 Support Options"
    );
}

/**
 * Confirmation menu - Yes/No selection
 * @param {string} message - Confirmation message
 * @returns {Object} Formatted list message for confirmation
 */
export function buildConfirmationMenu(message) {
    return buildListMessage(
        message,
        [
            buildSection("Confirm", [
                buildRow("confirm-yes", "✅ Ya", "Lanjutkan aksi"),
                buildRow("confirm-no", "❌ Batal", "Batalkan")
            ])
        ],
        "",
        "⚠️ Choose Action"
    );
}
