import { buildLogbookMenu, buildReminderMenu, buildScheduleMenu, buildDonateMenu, buildMainMenu } from '../utils/listMessageBuilder.js'
import { handleLogbook } from '../handler/logbookHandler.js'
import { handleReminder } from '../handler/reminderHandler.js'
import { handleSchedule } from '../handler/scheduleHandler.js'
import { handleDonate } from '../handler/donateHandler.js'
import { enqueueMessage } from '../services/messageQueue.js'

const STATE = {}

function getUserState(jid) {
    if (!STATE[jid]) {
        STATE[jid] = { currentMenu: null, lastAction: null, data: {} }
    }
    return STATE[jid]
}

export async function handleInteractiveSelection(context) {
    const { selectedRowId, sock, groupId, sender } = context
    if (!selectedRowId) return false
    const userState = getUserState(sender)
    console.log('📱 Interactive selection from ' + sender + ': ' + selectedRowId)
    try {
        if (selectedRowId === 'menu-logbook') {
            userState.currentMenu = 'logbook'
            return await enqueueMessage(sock, groupId, buildLogbookMenu())
        }
        if (selectedRowId === 'menu-reminder') {
            userState.currentMenu = 'reminder'
            return await enqueueMessage(sock, groupId, buildReminderMenu())
        }
        if (selectedRowId === 'menu-task') {
            return await enqueueMessage(sock, groupId, {
                text: '📝 *TASK MENU*\n\n❌ Fitur ini belum tersedia.\n\nGunakan /task untuk info lebih lanjut.'
            })
        }
        if (selectedRowId === 'menu-schedule') {
            userState.currentMenu = 'schedule'
            return await enqueueMessage(sock, groupId, buildScheduleMenu())
        }
        if (selectedRowId === 'menu-donate') {
            userState.currentMenu = 'donate'
            return await enqueueMessage(sock, groupId, buildDonateMenu())
        }
        if (selectedRowId === 'logbook-fill') {
            return await handleLogbook({
                sock, groupId, args: ['fill'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'logbook-info') {
            return await handleLogbook({
                sock, groupId, args: ['info'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'logbook-matkul') {
            return await handleLogbook({
                sock, groupId, args: ['matkul'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'reminder-create') {
            return await handleReminder({
                sock, groupId, args: ['create'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'reminder-list') {
            return await handleReminder({
                sock, groupId, args: ['list'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'reminder-delete') {
            return await handleReminder({
                sock, groupId, args: ['delete'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'reminder-toggle') {
            return await handleReminder({
                sock, groupId, args: ['toggle'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'schedule-create') {
            return await handleSchedule({
                sock, groupId, args: ['create'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'schedule-list') {
            return await handleSchedule({
                sock, groupId, args: ['list'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'schedule-delete') {
            return await handleSchedule({
                sock, groupId, args: ['delete'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'donate-saweria') {
            return await handleDonate({
                sock, groupId, args: ['saweria'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'donate-trakteer') {
            return await handleDonate({
                sock, groupId, args: ['trakteer'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'donate-transfer') {
            return await handleDonate({
                sock, groupId, args: ['transfer'], sender,
                reply: (msg) => enqueueMessage(sock, groupId, msg)
            })
        }
        if (selectedRowId === 'back-menu') {
            userState.currentMenu = null
            return await enqueueMessage(sock, groupId, buildMainMenu())
        }
        console.warn('⚠️ Unknown row selection: ' + selectedRowId)
        return false
    } catch (error) {
        console.error('❌ Error handling interactive selection:', error)
        return await enqueueMessage(sock, groupId, {
            text: '❌ Terjadi kesalahan saat memproses pilihan Anda.\n\nCoba ketik /menu untuk kembali ke menu utama.'
        })
    }
}

export function clearUserState(jid) {
    delete STATE[jid]
}

export function getUserStateData(jid) {
    if (!STATE[jid]) {
        STATE[jid] = { currentMenu: null, lastAction: null, data: {} }
    }
    return STATE[jid]
}
