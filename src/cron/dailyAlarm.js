import { sendAlarmImage } from '../services/alarm.service.js';

/**
 * Cron job untuk mengirim alarm gambar setiap jam 7 pagi
 * Timezone: Asia/Jakarta (WIB)
 */
export async function sendDailyAlarm(client) {
    console.log('🔔 Running daily alarm at 7 AM (Asia/Jakarta)...');

    try {
        await sendAlarmImage();
        console.log('✅ Daily alarm sent successfully');
    } catch (error) {
        console.error('❌ Failed to send daily alarm:', error);
    }
}
