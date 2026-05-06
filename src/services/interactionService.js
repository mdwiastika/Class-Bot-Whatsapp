const sessions = new Map()

export function setPendingAction(jid, payload) {
    sessions.set(jid, { ...payload, createdAt: Date.now() })
}

export function getPendingAction(jid) {
    return sessions.get(jid) || null
}

export function clearPendingAction(jid) {
    return sessions.delete(jid)
}

export function clearAllSessions() {
    sessions.clear()
}

// NOTE: in-memory sessions. Persistence or TTL can be added if needed.
