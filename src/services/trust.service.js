import db from '../db/index.js';

class TrustService {
    getTrustScore(userId) {
        const data = db.prepare('SELECT score, reason FROM trust_score WHERE user_id = ?').get(userId);
        return data ? data.score : 100; // Default 100
    }

    deductTrust(userId, amount, reason) {
        const currentScore = this.getTrustScore(userId);
        const newScore = Math.max(0, currentScore - amount); // Floor at 0

        const existing = db.prepare('SELECT user_id FROM trust_score WHERE user_id = ?').get(userId);
        if (existing) {
            db.prepare('UPDATE trust_score SET score = ?, reason = ? WHERE user_id = ?').run(newScore, reason, userId);
        } else {
            db.prepare('INSERT INTO trust_score (user_id, score, reason) VALUES (?, ?, ?)').run(userId, newScore, reason);
        }

        return newScore;
    }

    // Observer Logic: Call this on message/interaction events
    observeUserBehavior(userId, activityType) {
        // Simple heuristic for now
        // activityType: 'spam', 'exploit_attempt', 'toxic_language'

        let penalty = 0;
        let reason = '';

        if (activityType === 'spam') {
            penalty = 5;
            reason = 'Detected Spamming';
        } else if (activityType === 'exploit_attempt') {
            penalty = 20;
            reason = 'Attempted System Exploit';
        }

        if (penalty > 0) {
            this.deductTrust(userId, penalty, reason);
        }
    }
}

export default new TrustService();
