export function buildListMessage(description, sections, footer = "", buttonText = "Pilih menu") {
    if (!description || !Array.isArray(sections) || sections.length === 0) {
        throw new Error("buildListMessage requires description and non-empty sections")
    }

    return {
        interactiveMenu: {
            title: "Class Manager Bot",
            description,
            buttonText,
            sections,
            footerText: footer || undefined,
        }
    }
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
        throw new Error("buildSection requires title (string) and rows (array)")
    }

    return {
        title,
        rows
    }
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
        throw new Error("buildRow requires rowId (string) and title (string)")
    }

    return {
        rowId,
        title,
        description: description || undefined
    }
}

/**
 * Main menu list message - Shows all available features
 * @returns {Object} Formatted list message for main menu
 */
export function buildMainMenu() {
    return buildListMessage(
        "Pilih fitur yang ingin dipakai:",
        [
            buildSection("📚 Features", [
                buildRow("menu-logbook", "📖 Logbook", "Isi logbook via WhatsApp"),
                buildRow("menu-reminder", "🔔 Reminder", "Atur pengingat logbook otomatis"),
                buildRow("menu-task", "📝 Task", "Kelola tugas & deadline kelas"),
                buildRow("menu-schedule", "📅 Schedule", "Jadwalkan pesan berkala"),
                buildRow("menu-donate", "💖 Donate", "Dukung pengembang")
            ])
        ],
        "Tap salah satu fitur",
        "Lihat fitur"
    )
}

/**
 * Logbook menu list message
 * @returns {Object} Formatted list message for logbook menu
 */
export function buildLogbookMenu() {
    return buildListMessage(
        "📖 Logbook\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Logbook Actions", [
                buildRow("logbook-fill", "✍️ Isi Logbook", "Mulai isi logbook baru"),
                buildRow("logbook-info", "ℹ️ Info Logbook", "Lihat petunjuk pengisian"),
                buildRow("logbook-matkul", "📚 Daftar Mata Kuliah", "Lihat mata kuliah yang tersedia")
            ])
        ],
        "Tap salah satu aksi",
        "Pilih aksi"
    )
}

/**
 * Reminder menu list message
 * @returns {Object} Formatted list message for reminder menu
 */
export function buildReminderMenu() {
    return buildListMessage(
        "🔔 Reminder\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Reminder Actions", [
                buildRow("reminder-create", "➕ Tambah Reminder", "Buat reminder baru"),
                buildRow("reminder-list", "📋 Lihat Reminders", "Tampilkan semua reminder aktif"),
                buildRow("reminder-delete", "🗑️ Hapus Reminder", "Hapus reminder yang ada"),
                buildRow("reminder-toggle", "🔄 Ubah Status", "Aktifkan atau nonaktifkan reminder")
            ])
        ],
        "Tap salah satu aksi",
        "Pilih aksi"
    )
}

/**
 * Schedule menu list message
 * @returns {Object} Formatted list message for schedule menu
 */
export function buildScheduleMenu() {
    return buildListMessage(
        "📅 Schedule\nPilih aksi yang ingin kamu lakukan:",
        [
            buildSection("Schedule Actions", [
                buildRow("schedule-create", "➕ Buat Jadwal", "Buat jadwal pengiriman pesan baru"),
                buildRow("schedule-list", "📋 Lihat Jadwal", "Tampilkan semua jadwal aktif"),
                buildRow("schedule-delete", "🗑️ Hapus Jadwal", "Hapus jadwal yang ada")
            ])
        ],
        "Tap salah satu aksi",
        "Pilih aksi"
    )
}

/**
 * Donate menu list message
 * @returns {Object} Formatted list message for donation
 */
export function buildDonateMenu() {
    return buildListMessage(
        "💖 Support Bot\nTerima kasih atas dukunganmu. Pilih metode:",
        [
            buildSection("Donation Methods", [
                buildRow("donate-saweria", "💳 Saweria", "Donasi via Saweria"),
                buildRow("donate-trakteer", "☕ Trakteer", "Donasi via Trakteer.id"),
                buildRow("donate-transfer", "🏦 Transfer Bank", "Informasi transfer bank")
            ])
        ],
        "Terima kasih sudah support",
        "Pilih metode"
    )
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
        "Pilih"
    )
}
