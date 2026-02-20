const reminderMessages = [
    "Eh, logbooknya jangan lupa ya 👀",
    "Sudah update logbook hari ini kawan?",
    "Logbook dulu yuk, biar tenang 😌",
    "Sebelum lupa, isi logbook sekarang aja ✍️",
    "Cuma ngingetin… logbooknya ya 😁",
    "Progress hari ini sudah dicatat belum?",
    "Jangan sampai ke-skip logbook hari ini 🚨",
    "Udah rebahan? Logbook dulu dong 😆",
    "Catat dulu kegiatannya biar aman 😎",
    "Masih ada yang kurang… iya, logbook 😏",
    "Gas update logbook sebelum lupa 🔥",
    "Logbooknya manggil-manggil tuh 😂",
    "Kalau bukan sekarang, kapan? Logbook dulu 😌",
    "Logbook nggak bakal isi sendiri loh 😆",
]

export const getRandomReminder = () => {
    const randomIndex = Math.floor(Math.random() * reminderMessages.length)
    return reminderMessages[randomIndex]
}