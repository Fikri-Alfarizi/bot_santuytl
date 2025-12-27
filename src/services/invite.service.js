import db from '../db/index.js';

class InviteService {
    trackInvite(inviterId, invitedId) {
        try {
            const now = Date.now();
            db.prepare(`
                INSERT INTO invites (inviter_id, invited_id, timestamp, is_valid)
                VALUES (?, ?, ?, 1)
            `).run(inviterId, invitedId, now);
            return true;
        } catch (e) {
            // Unique constraint violation means already tracked
            return false;
        }
    }

    getInviteCount(userId) {
        const result = db.prepare('SELECT COUNT(*) as count FROM invites WHERE inviter_id = ? AND is_valid = 1').get(userId);
        return result ? result.count : 0;
    }
}

export default new InviteService();
