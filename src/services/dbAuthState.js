import pool from "../config/db.js"
import {
    initAuthCreds,
    BufferJSON,
    proto
} from "ourin-baileys"

const SESSION_ID = "main" // Kamu bisa ganti ini kalau mau multi-session

export async function useDbAuthState() {
    const writeData = async (data, id) => {
        try {
            const jsonStr = JSON.stringify(data, BufferJSON.replacer);
            await pool.query(
                `INSERT INTO wa_sessions (id, data) VALUES ($1, $2)
                 ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
                [`${SESSION_ID}-${id}`, jsonStr]
            );
        } catch (err) {
            console.error("DB Auth Write Error:", err);
        }
    }

    const readData = async (id) => {
        try {
            const { rows } = await pool.query(
                "SELECT data FROM wa_sessions WHERE id = $1",
                [`${SESSION_ID}-${id}`]
            );
            if (rows.length > 0) {
                return JSON.parse(rows[0].data, BufferJSON.reviver);
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (newData) => {
                    const tasks = [];
                    for (const category in newData) {
                        for (const id in newData[category]) {
                            const value = newData[category][id];
                            const keyId = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, keyId));
                            } else {
                                tasks.push(
                                    pool.query("DELETE FROM wa_sessions WHERE id = $1", [`${SESSION_ID}-${keyId}`])
                                );
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        }
    }
}