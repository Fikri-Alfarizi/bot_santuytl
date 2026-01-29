import { sendAlarmToChannel } from '../services/alarm.service.js';
import guildService from '../services/guild.service.js';

/**
 * Cron job untuk mengirim alarm gambar
 * Loop semua guilds dan kirim ke channel yang sudah di-set
 */
export async function sendDailyAlarm(client) {
    console.log('🔔 Running daily alarm...');

    // Get all guilds
    const guilds = client.guilds.cache;

    for (const [guildId, guild] of guilds) {
        try {
            const settings = guildService.getSettings(guildId);

            // Skip jika belum set alarm channel
            if (!settings || !settings.alarm_channel_id) {
                console.log(`⏭️ Skipping guild ${guild.name} - no alarm channel set`);
                continue;
            }

            // Kirim alarm ke channel
            await sendAlarmToChannel(client, settings.alarm_channel_id);

        } catch (error) {
            console.error(`❌ Failed to send alarm to guild ${guildId}:`, error.message);
        }
    }

    console.log('✅ Daily alarm completed');
}
