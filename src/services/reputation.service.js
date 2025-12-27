import db from '../db/index.js';

class ReputationService {
    getReputation(userId) {
        const data = db.prepare('SELECT rep_points, last_given FROM reputation WHERE user_id = ?').get(userId);
        return data || { rep_points: 0, last_given: 0 };
    }

    giveReputation(giverId, receiverId) {
        const giverData = this.getReputation(giverId);
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000; // 24 Hours

        if (now - giverData.last_given < COOLDOWN) {
            const timeLeft = COOLDOWN - (now - giverData.last_given);
            const hours = Math.ceil(timeLeft / (1000 * 60 * 60));
            return { success: false, message: `Sabar bro! Lo baru bisa kasih Rep lagi dalam ${hours} jam.` };
        }

        if (giverId === receiverId) {
            return { success: false, message: "Gak bisa kasih Rep ke diri sendiri lah, kocak!" };
        }

        // Update Giver's cooldown
        const existingGiver = db.prepare('SELECT user_id FROM reputation WHERE user_id = ?').get(giverId);
        if (existingGiver) {
            db.prepare('UPDATE reputation SET last_given = ? WHERE user_id = ?').run(now, giverId);
        } else {
            db.prepare('INSERT INTO reputation (user_id, rep_points, last_given) VALUES (?, 0, ?)').run(giverId, now);
        }

        // Add Point to Receiver
        const existingReceiver = db.prepare('SELECT user_id FROM reputation WHERE user_id = ?').get(receiverId);
        if (existingReceiver) {
            db.prepare('UPDATE reputation SET rep_points = rep_points + 1 WHERE user_id = ?').run(receiverId);
        } else {
            db.prepare('INSERT INTO reputation (user_id, rep_points, last_given) VALUES (?, 1, 0)').run(receiverId);
        }

        return { success: true, message: "Respect +1! Reputasi berhasil dikirim." };
    }
}

export default new ReputationService();
