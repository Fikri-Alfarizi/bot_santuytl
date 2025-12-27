import db from '../db/index.js';

class SeasonService {
    getCurrentSeason() {
        return db.prepare('SELECT * FROM seasons WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
    }

    startNewSeason(name, daysDuration) {
        const current = this.getCurrentSeason();
        if (current) {
            this.endSeason(current.id);
        }

        const nextNumber = current ? current.season_number + 1 : 1;
        const startDate = Date.now();
        const endDate = startDate + (daysDuration * 24 * 60 * 60 * 1000);

        db.prepare(`
            INSERT INTO seasons (season_number, name, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, 1)
        `).run(nextNumber, name, startDate, endDate);

        return this.getCurrentSeason();
    }

    endSeason(seasonId) {
        db.prepare('UPDATE seasons SET is_active = 0 WHERE id = ?').run(seasonId);
        // Here we could trigger rewards, snapshots, etc.
    }

    getSeasonTimeLeft() {
        const season = this.getCurrentSeason();
        if (!season) return null;

        const now = Date.now();
        if (now >= season.end_date) return 0;

        return season.end_date - now;
    }
}

export default new SeasonService();
