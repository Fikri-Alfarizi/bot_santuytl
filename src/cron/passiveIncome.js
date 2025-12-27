import db from '../db/index.js';

export function distributePassiveIncome(client) {
    // console.log('[PASSIVE] Distributing income to online users...');

    const REWARD_PER_MINUTE = 60; // 1 RP per second x 60

    // Prepare transaction for performance
    const addCoinStmt = db.prepare(`UPDATE users SET coins = coins + ${REWARD_PER_MINUTE} WHERE id = ?`);
    const checkUserStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const createUserStmt = db.prepare(`INSERT INTO users (id, username, coins) VALUES (?, ?, ${REWARD_PER_MINUTE})`);

    const transaction = db.transaction((onlineUsers) => {
        for (const user of onlineUsers) {
            const existing = checkUserStmt.get(user.id);
            if (existing) {
                addCoinStmt.run(user.id);
            } else {
                createUserStmt.run(user.id, user.username);
            }
        }
    });

    try {
        const onlineUsers = [];

        client.guilds.cache.forEach(guild => {
            // We rely on cache. Make sure Intent GuildPresences is ON.
            guild.members.cache.forEach(member => {
                if (!member.user.bot) {
                    const status = member.presence?.status;
                    // 'online', 'idle', 'dnd' count as online. 'offline' or undefined does not.
                    if (status === 'online' || status === 'idle' || status === 'dnd') {
                        onlineUsers.push({
                            id: member.user.id,
                            username: member.user.username
                        });
                    }
                }
            });
        });

        if (onlineUsers.length > 0) {
            transaction(onlineUsers);
            // console.log(`[PASSIVE] Gave ${REWARD_PER_MINUTE} coins to ${onlineUsers.length} online users.`);
        }
    } catch (error) {
        console.error('[PASSIVE ERROR]', error);
    }
}
