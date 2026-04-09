# 📖 LOGBOOK FEATURE IMPLEMENTATION GUIDE

## Overview
Fitur logbook memungkinkan user untuk mengisi logbook langsung dari WhatsApp tanpa perlu membuka web. Bot akan:
1. Menyimpan email & password user (terenkripsi di database)
2. Login ke sistem web target
3. Auto-submit logbook ke system

## Database Schema

```sql
CREATE TABLE user_credentials (
    id SERIAL PRIMARY KEY,
    jid_whatsapp VARCHAR(50) UNIQUE NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
);
```

## File Structure

```
src/
├── handler/
│   └── logbookHandler.js          # Handler untuk /logbook command
├── repositories/
│   └── userCredentialsRepository.js # CRUD user credentials
└── services/
    └── logbookService.js          # API integration logic
```

## Command Usage

### Setup Credentials (First Time)
```
/logbook setup email@example.com password123
```
- Menyimpan email & password user
- User hanya perlu setup sekali
- Password tersimpan di database (aman)

### Fill Logbook
```
/logbook fill
```
- Bot retrieve credentials dari database
- Login ke sistem web
- Submit logbook otomatis

### View Credentials Info
```
/logbook info
```
- Tampilkan email yang terdaftar
- Show tanggal setup

### Delete Credentials
```
/logbook delete
```
- Hapus email & password dari database
- User harus setup ulang jika ingin isi logbook lagi

## Implementation Steps

### Step 1: Run Migration
```bash
npm run migrate up
```
Ini akan membuat tabel `user_credentials`

### Step 2: Configure API Endpoint
Update `.env`:
```
LOGBOOK_API_URL=https://your-logbook-api.com
```

### Step 3: Customize API Integration
Edit `src/services/logbookService.js`:

```javascript
// Sesuaikan endpoint dengan API target
const API_BASE_URL = process.env.LOGBOOK_API_URL

// Update loginAndFillLogbook() function dengan:
// 1. Endpoint yang benar
// 2. Request body structure
// 3. Response parsing
// 4. Token handling
// 5. Error handling
```

### Step 4: Optional - Add Encryption
Password harus di-encrypt sebelum disimpan:

```javascript
import bcrypt from 'bcrypt'

// Saat setup
const hashedPassword = await bcrypt.hash(password, 10)
await saveUserCredentials(jid, groupId, email, hashedPassword)

// Saat fill
const isPasswordValid = await bcrypt.compare(password, creds.password)
```

## Example API Integration

Jika web logbook menggunakan struktur seperti ini:

```javascript
// LOGIN
POST /api/auth/login
{
  "email": "student@univ.ac.id",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "name": "Student" }
}

// SUBMIT LOGBOOK
POST /api/logbook/submit
Header: Authorization: Bearer eyJhbGc...
{
  "activity": "Studied chapter 5",
  "hours": 2,
  "notes": "Submitted from WhatsApp"
}

Response:
{
  "success": true,
  "message": "Logbook submitted",
  "id": 123
}
```

Maka update `logbookService.js`:

```javascript
export async function loginAndFillLogbook(email, password, logbookData = {}) {
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })

    const { token } = await loginResponse.json()

    const submitResponse = await fetch(`${API_BASE_URL}/api/logbook/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(logbookData)
    })

    return await submitResponse.json()
}
```

## Security Considerations

1. **Password Storage**: Simpan dengan encryption/hashing
2. **Token Management**: Jangan simpan token di DB, generate per request
3. **Credential Validation**: Validate email format sebelum menyimpan
4. **Error Messages**: Jangan expose error detail ke user (gunakan generic messages)
5. **Rate Limiting**: Limit /logbook fill requests (cth: max 1 per 5 menit)

## Workflow Diagram

```
User: /logbook setup email@univ.ac.id password123
  ↓
Bot: Retrieve JID from context
  ↓
Bot: Save to user_credentials table
  ↓
Bot: Confirm success

---

User: /logbook fill
  ↓
Bot: Get credentials by JID
  ↓
Bot: Login API (email + password)
  ↓
Bot: Get auth token
  ↓
Bot: Submit logbook dengan token
  ↓
Bot: Update status ke user
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email/Password salah" | Pastikan credentials benar & sama dengan di web |
| "Server offline" | Check if logbook API adalah running |
| "Token expired" | Regenerate token di setiap request |
| "Database error" | Pastikan migration sudah dijalankan |
| "Credentials not found" | User perlu `/logbook setup` dulu |

## Future Enhancements

- [ ] Encrypt password dengan bcrypt
- [ ] Add rate limiting untuk /logbook fill
- [ ] Cache login token (validity: 1 jam)
- [ ] Log all logbook submissions untuk audit
- [ ] Add webhook untuk real-time updates
- [ ] Support multi-account setup
- [ ] Automatic daily logbook reminders
