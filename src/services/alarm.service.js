import axios from 'axios';

/**
 * Service untuk mengirim gambar alarm
 * - Prioritas: Kirim ke channel Discord (dari settings)
 * - Fallback: Webhook (jika tidak ada channel setting)
 */

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1466353346305589410/n2NTcj7k_kBUBBmY9Bh4H6yLbvtf5EbgOHTBGaEfHpzmX3qhmLuMt4Xz26BbHFOOuetp';
const IMAGE_URL = 'https://media.discordapp.net/attachments/1440966497915633725/1466353963572920404/75ee3c714245052e4c8e7ab482bab455.png?ex=697c700c&is=697b1e8c&hm=d5c74299ecc2002dfc1335148e240555dac0e9ed7f03cf4d6c754aca375c9e25&=&format=webp&quality=lossless&width=354&height=354';

/**
 * Kirim gambar alarm ke Discord channel
 * @param {Object} client - Discord client
 * @param {string} channelId - Channel ID tujuan
 */
export async function sendAlarmToChannel(client, channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            console.error(`Channel ${channelId} not found or not text-based`);
            return false;
        }

        // Kirim gambar langsung (tanpa embed)
        await channel.send(IMAGE_URL);

        console.log('✅ Alarm sent to channel:', channelId, 'at', new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false
        }));

        return true;
    } catch (error) {
        console.error('❌ Failed to send alarm to channel:', error.message);
        return false;
    }
}

/**
 * Kirim gambar alarm via webhook (fallback)
 */
export async function sendAlarmViaWebhook() {
    try {
        await axios.post(WEBHOOK_URL, {
            content: IMAGE_URL,
            username: 'Alarm Bot',
            avatar_url: IMAGE_URL
        });

        console.log('✅ Alarm sent via webhook at', new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false
        }));

        return true;
    } catch (error) {
        console.error('❌ Failed to send alarm via webhook:', error.message);
        return false;
    }
}

/**
 * Test function - kirim via webhook
 */
export async function testAlarmImage() {
    console.log('🧪 Testing alarm webhook...');
    return await sendAlarmViaWebhook();
}
