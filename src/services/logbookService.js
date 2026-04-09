/**
 * Service untuk hit API logbook web lain
 * 
 * IMPLEMENTASI:
 * Sesuaikan URL_LOGIN, URL_SUBMIT, dan logic submit
 * dengan endpoint API dari web logbook target
 */

const API_BASE_URL = process.env.LOGBOOK_API_URL || "https://logbook-api.example.com"

export async function loginAndFillLogbook(email, password, logbookData = {}) {
    try {
        // Step 1: Login ke sistem web
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password
            })
        })

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.statusText}`)
        }

        const loginData = await loginResponse.json()
        const token = loginData.token || loginData.access_token

        if (!token) {
            throw new Error("No token received from server")
        }

        // Step 2: Submit logbook dengan token
        const submitResponse = await fetch(`${API_BASE_URL}/logbook/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                ...logbookData,
                submitted_at: new Date().toISOString(),
                source: "whatsapp_bot"
            })
        })

        if (!submitResponse.ok) {
            throw new Error(`Submit failed: ${submitResponse.statusText}`)
        }

        const submitData = await submitResponse.json()

        return {
            success: true,
            message: "Logbook berhasil diisi",
            data: submitData
        }

    } catch (error) {
        console.error("Logbook API Error:", error)
        return {
            success: false,
            message: error.message,
            error: error
        }
    }
}

/**
 * Template untuk submit logbook dengan custom data
 * Sesuaikan dengan struktur API web logbook
 */
export async function submitLogbookWithDetails(email, password, details) {
    try {
        // Validasi input
        if (!email || !password) {
            throw new Error("Email dan password diperlukan")
        }

        // Bisa tambahkan validasi details di sini
        // const { activity, hours, notes } = details

        // Login dan submit
        const result = await loginAndFillLogbook(email, password, details)

        return result

    } catch (error) {
        console.error("Submit logbook error:", error)
        return {
            success: false,
            message: error.message
        }
    }
}

/**
 * Get logbook status untuk user tertentu
 */
export async function getLogbookStatus(email, password) {
    try {
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password })
        })

        if (!loginResponse.ok) {
            throw new Error("Login failed")
        }

        const loginData = await loginResponse.json()
        const token = loginData.token

        const statusResponse = await fetch(`${API_BASE_URL}/logbook/status`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })

        const statusData = await statusResponse.json()

        return {
            success: true,
            data: statusData
        }

    } catch (error) {
        console.error("Get status error:", error)
        return {
            success: false,
            message: error.message
        }
    }
}
