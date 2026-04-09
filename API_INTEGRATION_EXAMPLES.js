// EXAMPLE API INTEGRATION
// =====================================================
// Panduan ini menunjukkan berbagai contoh API structure
// dan bagaimana customize logbookService.js

// ==================== EXAMPLE 1 ====================
// Simple Email-Password Login

/*
API ENDPOINT: https://logbook.example.com

1. LOGIN
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "student@univ.ac.id",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "name": "John Doe"
  }
}

2. SUBMIT LOGBOOK
POST /api/logbook/submit
Authorization: Bearer eyJhbGc...

Request:
{
  "activities": "Studied chapter 5",
  "hours": 3
}

Response:
{
  "success": true,
  "id": 456
}
*/

// IMPLEMENTATION:
export async function loginAndFillLogbook(email, password, logbookData = {}) {
    const API_BASE = process.env.LOGBOOK_API_URL
    
    try {
        // LOGIN
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        
        if (!loginRes.ok) throw new Error("Login failed")
        
        const loginData = await loginRes.json()
        const token = loginData.token
        
        if (!token) throw new Error("No token received")
        
        // SUBMIT LOGBOOK
        const submitRes = await fetch(`${API_BASE}/api/logbook/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(logbookData)
        })
        
        if (!submitRes.ok) throw new Error("Submit failed")
        
        const submitData = await submitRes.json()
        return { success: true, data: submitData }
        
    } catch (error) {
        return { success: false, message: error.message }
    }
}


// ==================== EXAMPLE 2 ====================
// OAuth Token based

/*
API ENDPOINT: https://secure-logbook.example.com

1. GET TOKEN
POST /oauth/token

Request (form-urlencoded):
grant_type=password
username=student@univ.ac.id
password=password123
client_id=wa_bot_app
client_secret=secret_key_123

Response:
{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "expires_in": 3600
}

2. SUBMIT
POST /api/v1/logbook
Authorization: Bearer 2YotnFZF...
*/

export async function loginAndFillLogbook_OAuth(email, password, logbookData = {}) {
    const API_BASE = process.env.LOGBOOK_API_URL
    const CLIENT_ID = process.env.OAUTH_CLIENT_ID
    const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET
    
    try {
        // GET TOKEN
        const tokenRes = await fetch(`${API_BASE}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "password",
                username: email,
                password: password,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            })
        })
        
        if (!tokenRes.ok) throw new Error("OAuth token failed")
        
        const tokenData = await tokenRes.json()
        const token = tokenData.access_token
        
        // SUBMIT
        const submitRes = await fetch(`${API_BASE}/api/v1/logbook`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(logbookData)
        })
        
        if (!submitRes.ok) throw new Error("Submit failed")
        
        return { success: true, data: await submitRes.json() }
        
    } catch (error) {
        return { success: false, message: error.message }
    }
}


// ==================== EXAMPLE 3 ====================
// API Key based

/*
API ENDPOINT: https://api.logbook.example.com

1. GET API TOKEN
POST /auth/generate-token

Request:
{
  "email": "student@univ.ac.id",
  "password": "password123"
}

Response:
{
  "api_token": "api_key_xyz123abc"
}

2. SUBMIT
POST /logbooks
X-API-Key: api_key_xyz123abc
*/

export async function loginAndFillLogbook_APIKey(email, password, logbookData = {}) {
    const API_BASE = process.env.LOGBOOK_API_URL
    
    try {
        // GET API TOKEN
        const tokenRes = await fetch(`${API_BASE}/auth/generate-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        
        if (!tokenRes.ok) throw new Error("Token generation failed")
        
        const tokenData = await tokenRes.json()
        const apiKey = tokenData.api_token
        
        // SUBMIT
        const submitRes = await fetch(`${API_BASE}/logbooks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey
            },
            body: JSON.stringify(logbookData)
        })
        
        if (!submitRes.ok) throw new Error("Submit failed")
        
        return { success: true, data: await submitRes.json() }
        
    } catch (error) {
        return { success: false, message: error.message }
    }
}


// ==================== ERROR HANDLING TIPS ====================

function getErrorMessage(error) {
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return "Email/Password salah"
    } else if (error.message.includes("404")) {
        return "API endpoint tidak ditemukan"
    } else if (error.message.includes("timeout")) {
        return "Koneksi timeout, coba lagi"
    } else if (error.message.includes("Network")) {
        return "Gagal terkoneksi ke server"
    } else {
        return error.message
    }
}

// Gunakan: return { success: false, message: getErrorMessage(error) }
