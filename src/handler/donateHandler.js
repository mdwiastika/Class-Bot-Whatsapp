import { enqueueMessage } from "../services/messageQueue.js"

export async function handleDonate({ sock, groupId }) {
    return enqueueMessage(sock, groupId, {
        text: `
╔════════════════════════╗
║ 💖 SUPPORT BOT INI     ║
╚════════════════════════╝

🙏 *Terima kasih sudah pakai bot ini!*

Jika bot ini membantu & bermanfaat,
kamu bisa mendukung pengembangannya 💪

────────────────────

👤 *A/N: Marcel Dwi Astika*

*🏦 TRANSFER BANK*

💳 *BCA*
   0501165076

💳 *SeaBank*
   901770566633

────────────────────

*📱 E-WALLET*
0895339390753

Tersedia di:
🔸 OVO
🔸 DANA  
🔸 GoPay
🔸 ShopeePay

────────────────────

✨ Setiap donasi sangat berarti!
🔥 Membantu develop fitur baru
⚙️  Maintenance & support
🚀 Terima kasih banyak! 🙌
`
    })
}