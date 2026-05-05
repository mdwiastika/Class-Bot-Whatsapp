import { enqueueMessage } from "../services/messageQueue.js"

const menuButtons = [
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "📖 Logbook",
      id: "/menu logbook",
    }),
  },
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "🔔 Reminder",
      id: "/menu reminder",
    }),
  },
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "💖 Donate",
      id: "/menu donate",
    }),
  },
]

const logbookButtons = [
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "🔐 Setup",
      id: "/logbook setup",
    }),
  },
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "📚 Matkul",
      id: "/logbook matkul",
    }),
  },
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "✍️ Fill",
      id: "/logbook fill",
    }),
  },
]

const reminderButtons = [
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "📋 List",
      id: "/reminder list",
    }),
  },
]

const scheduleButtons = [
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "📋 List",
      id: "/schedule list",
    }),
  },
]

function createButtonMessage(title, description, buttons, footer = "Pilih di bawah atau ketik perintahnya") {
  return {
    interactiveMessage: {
      title: `${title}\n\n${description}`,
      footer: footer,
      buttons: buttons,
      headerType: 1
    }
  }
}

export async function handleMenu({ sock, groupId, args }) {
  const submenu = args[0]?.toLowerCase()

  if (!submenu) {
    await enqueueMessage(sock, groupId, createButtonMessage(
      `🎓 *Class Manager Bot*
──────────`,
      `Pilih fitur:
- 📖 /menu logbook
- 🔔 /menu reminder
- 📝 /menu task
- 📅 /menu schedule
- 💖 /menu donate
      `,
      menuButtons,
      "Pilih menu di bawah atau ketik perintahnya"
    ))
  }

  if (submenu === "logbook") {

    await enqueueMessage(sock, groupId, createButtonMessage(
      `📖 *Menu Logbook*
──────────`,
      `Perintah utama:
- /logbook setup email@pens.ac.id password
- /logbook matkul
- /logbook fill NOMOR HH:MM HH:MM "kegiatan"
- /logbook info
- /logbook delete

Contoh:
/logbook fill 1 07:00 16:00 "Belajar chapter 5`,
      logbookButtons,
      "Pilih menu di bawah atau ketik perintahnya"
    ))

  }

  if (submenu === "reminder") {
    await enqueueMessage(sock, groupId, createButtonMessage(
      `🔔 *Menu Reminder*
──────────`,
      `Perintah:
- /reminder add HH:MM
- /reminder list
- /reminder delete HH:MM
- /reminder on HH:MM
- /reminder off HH:MM

Format waktu: HH:MM (24 jam)
Contoh: /reminder add 20:30`,
      reminderButtons,
      "Pilih aksi di bawah atau ketik perintahnya"
    ))
  }

  if (submenu === "task") {
    return await enqueueMessage(sock, groupId, {
      text: "📝 *Task*\n──────────\n\nℹ️ Fitur ini masih dalam pengembangan.\nNanti akan ada manajemen tugas & deadline kelas."
    })
  }

  if (submenu === "schedule") {

    await enqueueMessage(sock, groupId, createButtonMessage(
      `📅 *Menu Schedule*
──────────`,
      `Jenis schedule:
- /schedule YYYY-MM-DD HH:MM Pesan
- /schedule daily HH:MM Pesan
- /schedule weekly [hari] HH:MM Pesan
- /schedule working HH:MM Pesan

Kelola schedule:
- /schedule list
- /schedule delete ID

Contoh:
/schedule daily 08:00 Selamat pagi`,
      scheduleButtons,
      "Pilih aksi di bawah atau ketik perintahnya"
    ))

  }

  if (submenu === "donate") {
    return await enqueueMessage(sock, groupId, {
      text: "💖 *Support Bot*\n──────────\n\nTerima kasih sudah pakai bot ini. Kalau bot ini membantu, kamu bisa support di:\n\n👤 A/N: Marcel Dwi Astika\n🏦 BCA: 0501165076\n🏦 SeaBank: 901770566633\n📱 E-Wallet: 0895339390753\n(OVO, DANA, GoPay, ShopeePay)\n\nTerima kasih banyak 🙌"
    })
  }
}

export async function handleTask({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `📝 Ketik /menu task untuk melihat detail fitur task.`
  })
}

export async function handleSchedule({ sock, groupId }) {
  await enqueueMessage(sock, groupId, {
    text: `📅 Ketik /menu schedule untuk melihat detail perintah schedule.`
  })
}
