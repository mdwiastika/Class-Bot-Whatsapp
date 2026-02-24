import pool from "../config/db.js"
import {
    initAuthCreds,
    proto,
    BufferJSON
} from "@whiskeysockets/baileys"

const SESSION_ID = "main"

export async function useDbAuthState() {

    const { rows } = await pool.query(
        "SELECT data FROM wa_sessions WHERE id = $1",
        [SESSION_ID]
    )

    let data

    if (rows.length === 0) {
        data = {
            creds: initAuthCreds(),
            keys: {}
        }

        await pool.query(
            "INSERT INTO wa_sessions (id, data) VALUES ($1, $2)",
            [SESSION_ID, data]
        )
    } else {
        data = JSON.parse(JSON.stringify(rows[0].data), BufferJSON.reviver)
    }

    const writeData = async () => {
        await pool.query(
            "UPDATE wa_sessions SET data = $1, updated_at = NOW() WHERE id = $2",
            [JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
                SESSION_ID]
        )
    }

    return {
        state: {
            creds: data.creds,
            keys: {
                get: async (type, ids) => {
                    const result = {}
                    for (const id of ids) {
                        let value = data.keys?.[type]?.[id]

                        if (type === "app-state-sync-key" && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value)
                        }

                        result[id] = value
                    }
                    return result
                },

                set: async (newData) => {
                    for (const category in newData) {
                        data.keys[category] = data.keys[category] || {}

                        for (const id in newData[category]) {
                            const value = newData[category][id]

                            if (value) {
                                data.keys[category][id] = value
                            } else {
                                delete data.keys[category][id]
                            }
                        }
                    }

                    await writeData()
                }
            }
        },

        saveCreds: async () => {
            data.creds = data.creds
            await writeData()
        }
    }
}