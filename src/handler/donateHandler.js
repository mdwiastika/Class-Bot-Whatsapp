import { enqueueMessage } from "../services/messageQueue.js"
export async function handleDonate({ sock, groupId }) {
    return enqueueMessage(sock, groupId, {
        text: `
💖 *Support Class Manager Bot*

Terima kasih sudah menggunakan bot ini 🙏  
Jika kamu merasa bot ini membantu, kamu bisa mendukung pengembangannya melalui:

━━━━━━━━━━━━━━━━━━

👤 *A/N* Marcel Dwi Astika

🏦 *BCA*
0501165076

🏦 *SeaBank*
901770566633

📱 *E-Wallet*
OVO / DANA / GoPay / ShopeePay
0895339390753

━━━━━━━━━━━━━━━━━━
Setiap dukungan sangat berarti untuk pengembangan fitur dan maintenance bot 🚀
Terima kasih banyak! 🙌
`
    })
}