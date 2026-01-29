import axios from 'axios';

/**
 * Service untuk mengirim gambar melalui Discord webhook
 * Tanpa menggunakan embed, hanya menampilkan gambar langsung seperti stiker
 */

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1466353346305589410/n2NTcj7k_kBUBBmY9Bh4H6yLbvtf5EbgOHTBGaEfHpzmX3qhmLuMt4Xz26BbHFOOuetp';
const IMAGE_URL = 'https://media.discordapp.net/attachments/1440966497915633725/1466353963572920404/75ee3c714245052e4c8e7ab482bab455.png?ex=697c700c&is=697b1e8c&hm=d5c74299ecc2002dfc1335148e240555dac0e9ed7f03cf4d6c754aca375c9e25&=&format=webp&quality=lossless&width=354&height=354';

/**
 * Mengirim gambar melalui webhook tanpa embed
 * Gambar akan muncul langsung (seperti stiker)
 */
export async function sendAlarmImage() {
    try {
        // Kirim hanya URL gambar tanpa embed
        // Discord akan otomatis menampilkan gambar dalam ukuran kecil
        const response = await axios.post(WEBHOOK_URL, {
            content: IMAGE_URL,
            username: 'Alarm Bot',
            avatar_url: IMAGE_URL
        });

        console.log('✅ Alarm image sent successfully at', new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false
        }));

        return true;
    } catch (error) {
        console.error('❌ Failed to send alarm image:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

/**
 * Test function untuk mengirim gambar langsung
 */
export async function testAlarmImage() {
    console.log('🧪 Testing alarm webhook...');
    return await sendAlarmImage();
}
