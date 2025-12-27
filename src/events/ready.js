import { scheduleDailyYap } from '../cron/dailyYap.js';

export default {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot ${client.user.tag} sudah online!`);
        scheduleDailyYap();
    },
};
